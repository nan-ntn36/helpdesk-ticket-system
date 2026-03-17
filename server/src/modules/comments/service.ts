import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../common/errors';
import { CreateCommentInput } from './schema';
import { emitToTicket, emitToUser, emitToStaff } from '../../lib/socket';

export async function getComments(ticketId: number) {
  // Verify ticket exists
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new NotFoundError('Ticket not found');

  return prisma.ticketComment.findMany({
    where: { ticketId },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createComment(
  ticketId: number,
  input: CreateCommentInput,
  userId: number
) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      createdBy: { select: { id: true, fullName: true } },
      assignedTo: { select: { id: true, fullName: true } },
    },
  });
  if (!ticket) throw new NotFoundError('Ticket not found');

  const comment = await prisma.ticketComment.create({
    data: {
      content: input.content,
      ticketId,
      userId,
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  try {
    const commentData = {
      id: comment.id,
      content: comment.content,
      ticketId,
      ticketTitle: ticket.title,
      user: comment.user,
      createdAt: comment.createdAt,
    };

    // 1. Emit to all users viewing this ticket detail (for real-time comment list)
    emitToTicket(ticketId, 'ticket:new-comment', commentData);

    // 2. Notify ticket creator (if not the commenter)
    if (ticket.createdById !== userId) {
      const msg = `${comment.user.fullName} đã comment trên ticket "${ticket.title}"`;
      await prisma.notification.create({
        data: { userId: ticket.createdById, type: 'NEW_COMMENT', message: msg, ticketId },
      });
      emitToUser(ticket.createdById, 'notification:new-comment', {
        ticketId,
        ticketTitle: ticket.title,
        commentBy: comment.user.fullName,
      });
    }

    // 3. Notify assigned agent (if exists, not the commenter, and not the creator to avoid duplicate)
    if (ticket.assignedToId && ticket.assignedToId !== userId && ticket.assignedToId !== ticket.createdById) {
      const msg = `${comment.user.fullName} đã comment trên ticket "${ticket.title}"`;
      await prisma.notification.create({
        data: { userId: ticket.assignedToId, type: 'NEW_COMMENT', message: msg, ticketId },
      });
      emitToUser(ticket.assignedToId, 'notification:new-comment', {
        ticketId,
        ticketTitle: ticket.title,
        commentBy: comment.user.fullName,
      });
    }
  } catch { /* socket not ready yet */ }

  return comment;
}
