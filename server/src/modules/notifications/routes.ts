import { Router, Response } from 'express';
import { authenticate } from '../../middlewares';
import { AuthenticatedRequest } from '../../common/types';
import * as notificationService from './service';

const router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get current user's notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const notifications = await notificationService.getNotifications(req.user!.userId);
  res.json({ success: true, data: notifications });
});

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     security:
 *       - bearerAuth: []
 */
router.get('/unread-count', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const count = await notificationService.getUnreadCount(req.user!.userId);
  res.json({ success: true, data: { count } });
});

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/read', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  await notificationService.markAsRead(req.user!.userId, parseInt(req.params.id as string));
  res.json({ success: true, message: 'Marked as read' });
});

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 */
router.patch('/read-all', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  await notificationService.markAllAsRead(req.user!.userId);
  res.json({ success: true, message: 'All marked as read' });
});

/**
 * @swagger
 * /notifications:
 *   delete:
 *     tags: [Notifications]
 *     summary: Clear all notifications
 *     security:
 *       - bearerAuth: []
 */
router.delete('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  await notificationService.clearNotifications(req.user!.userId);
  res.json({ success: true, message: 'Notifications cleared' });
});

export default router;
