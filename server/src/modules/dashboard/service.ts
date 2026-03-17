import { prisma } from '../../lib/prisma';

export async function getDashboardStats(userId: number, role: string) {
  // Role-based ticket filtering
  const roleFilter =
    role === 'ADMIN'
      ? {}
      : role === 'AGENT'
        ? { OR: [{ assignedToId: userId }, { assignedToId: null }] }
        : { createdById: userId };

  const [
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    closedTickets,
    urgentTickets,
    recentTickets,
  ] = await Promise.all([
    prisma.ticket.count({ where: roleFilter }),
    prisma.ticket.count({ where: { ...roleFilter, status: 'OPEN' } }),
    prisma.ticket.count({ where: { ...roleFilter, status: 'IN_PROGRESS' } }),
    prisma.ticket.count({ where: { ...roleFilter, status: 'RESOLVED' } }),
    prisma.ticket.count({ where: { ...roleFilter, status: 'CLOSED' } }),
    prisma.ticket.count({ where: { ...roleFilter, priority: 'URGENT' } }),
    prisma.ticket.findMany({
      where: roleFilter,
      include: {
        createdBy: { select: { id: true, fullName: true } },
        assignedTo: { select: { id: true, fullName: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return {
    counts: {
      total: totalTickets,
      open: openTickets,
      inProgress: inProgressTickets,
      resolved: resolvedTickets,
      closed: closedTickets,
      urgent: urgentTickets,
    },
    recentTickets,
  };
}
