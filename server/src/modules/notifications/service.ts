import { prisma } from '../../lib/prisma';
import { NotificationType } from '@prisma/client';

export async function createNotification(
  userId: number,
  type: NotificationType,
  message: string,
  ticketId: number
) {
  return prisma.notification.create({
    data: { userId, type, message, ticketId },
  });
}

export async function getNotifications(userId: number, limit = 30) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      ticket: { select: { id: true, title: true } },
    },
  });
}

export async function markAsRead(userId: number, notificationId: number) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: number) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function clearNotifications(userId: number) {
  return prisma.notification.deleteMany({
    where: { userId },
  });
}

export async function getUnreadCount(userId: number) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}
