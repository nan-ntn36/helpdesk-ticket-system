import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError } from '../../common/errors';
import { CreateTicketInput, UpdateTicketInput, TicketQuery } from './schema';
import { emitToStaff, emitToUser, emitAll } from '../../lib/socket';

const ticketInclude = {
  createdBy: { select: { id: true, fullName: true, email: true } },
  assignedTo: { select: { id: true, fullName: true, email: true } },
  category: { select: { id: true, name: true } },
  _count: { select: { comments: true, attachments: true } },
};

/**
 * Get tickets with role-based visibility:
 * - USER: only own tickets
 * - AGENT: assigned + unassigned tickets
 * - ADMIN: all tickets
 */
export async function getTickets(
  query: TicketQuery,
  userId: number,
  role: string
) {
  const page = parseInt(query.page);
  const limit = parseInt(query.limit);
  const skip = (page - 1) * limit;

  // Role-based where clause
  const roleFilter: Prisma.TicketWhereInput =
    role === 'ADMIN'
      ? {}
      : role === 'AGENT'
        ? { OR: [{ assignedToId: userId }, { assignedToId: null }] }
        : { createdById: userId }; // USER

  // Additional filters
  const where: Prisma.TicketWhereInput = {
    ...roleFilter,
    ...(query.status && { status: query.status }),
    ...(query.priority && { priority: query.priority }),
    ...(query.categoryId && { categoryId: parseInt(query.categoryId) }),
    ...(query.search && {
      OR: [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ],
    }),
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: ticketInclude,
      skip,
      take: limit,
      orderBy: { [query.sortBy!]: query.sortOrder },
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    data: tickets,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getTicketById(id: number, userId: number, role: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      ...ticketInclude,
      comments: {
        include: { user: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'asc' },
      },
      histories: {
        include: { user: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!ticket) throw new NotFoundError('Ticket not found');

  // Ownership check
  if (role === 'USER' && ticket.createdById !== userId) {
    throw new ForbiddenError('You can only view your own tickets');
  }

  return ticket;
}

export async function createTicket(input: CreateTicketInput, userId: number) {
  const ticket = await prisma.ticket.create({
    data: { ...input, createdById: userId },
    include: ticketInclude,
  });

  // Emit real-time notification to staff + save to DB
  try {
    emitToStaff('notification:new-ticket', {
      id: ticket.id,
      title: ticket.title,
      priority: ticket.priority,
      createdBy: ticket.createdBy.fullName,
      createdAt: ticket.createdAt,
    });

    // Save notification to DB for all ADMIN and AGENT users
    const staffUsers = await prisma.user.findMany({
      where: {
        role: { name: { in: ['ADMIN', 'AGENT'] } },
        isActive: true,
        id: { not: userId },
      },
      select: { id: true },
    });
    if (staffUsers.length > 0) {
      await prisma.notification.createMany({
        data: staffUsers.map(u => ({
          userId: u.id,
          type: 'NEW_TICKET' as const,
          message: `Ticket mới "${ticket.title}" bởi ${ticket.createdBy.fullName}`,
          ticketId: ticket.id,
        })),
      });
    }
  } catch { /* socket not ready yet */ }

  try { emitAll('ticket:list-updated'); } catch {}

  return ticket;
}

export async function updateTicket(
  id: number,
  input: UpdateTicketInput,
  userId: number
) {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) throw new NotFoundError('Ticket not found');

  // Record history for changed fields
  const historyEntries: Prisma.TicketHistoryCreateManyInput[] = [];

  for (const [key, newValue] of Object.entries(input)) {
    const oldValue = (ticket as any)[key];
    if (oldValue !== newValue && newValue !== undefined) {
      historyEntries.push({
        ticketId: id,
        userId,
        field: key,
        oldValue: String(oldValue ?? ''),
        newValue: String(newValue ?? ''),
      });
    }
  }

  const [updatedTicket] = await prisma.$transaction([
    prisma.ticket.update({
      where: { id },
      data: input,
      include: ticketInclude,
    }),
    ...(historyEntries.length > 0
      ? [prisma.ticketHistory.createMany({ data: historyEntries })]
      : []),
  ]);

  try { emitAll('ticket:list-updated'); } catch {}

  return updatedTicket;
}

export async function updateStatus(
  id: number,
  status: string,
  userId: number
) {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) throw new NotFoundError('Ticket not found');

  const [updatedTicket] = await prisma.$transaction([
    prisma.ticket.update({
      where: { id },
      data: { status: status as any },
      include: ticketInclude,
    }),
    prisma.ticketHistory.create({
      data: {
        ticketId: id,
        userId,
        field: 'status',
        oldValue: ticket.status,
        newValue: status,
      },
    }),
  ]);

  try { emitAll('ticket:list-updated'); } catch {}

  return updatedTicket;
}

export async function assignTicket(
  id: number,
  assignedToId: number | null,
  userId: number
) {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) throw new NotFoundError('Ticket not found');

  const [updatedTicket] = await prisma.$transaction([
    prisma.ticket.update({
      where: { id },
      data: { assignedToId },
      include: ticketInclude,
    }),
    prisma.ticketHistory.create({
      data: {
        ticketId: id,
        userId,
        field: 'assignedToId',
        oldValue: ticket.assignedToId ? String(ticket.assignedToId) : null,
        newValue: assignedToId ? String(assignedToId) : null,
      },
    }),
  ]);

  // Emit notification to assigned user + save to DB
  try {
    if (assignedToId) {
      emitToUser(assignedToId, 'notification:ticket-assigned', {
        id: updatedTicket.id,
        title: updatedTicket.title,
        assignedBy: userId,
      });
      await prisma.notification.create({
        data: {
          userId: assignedToId,
          type: 'TICKET_ASSIGNED',
          message: `Bạn được phân công ticket "${updatedTicket.title}"`,
          ticketId: updatedTicket.id,
        },
      });
    }
  } catch { /* socket not ready yet */ }

  try { emitAll('ticket:list-updated'); } catch {}

  return updatedTicket;
}

export async function deleteTicket(ticketId: number) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new NotFoundError('Ticket not found');

  // Cascade delete related records
  await prisma.$transaction([
    prisma.ticketComment.deleteMany({ where: { ticketId } }),
    prisma.ticketHistory.deleteMany({ where: { ticketId } }),
    prisma.attachment.deleteMany({ where: { ticketId } }),
    prisma.ticket.delete({ where: { id: ticketId } }),
  ]);

  try { emitAll('ticket:list-updated'); } catch {}

  return { id: ticketId };
}
