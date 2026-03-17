import { Router } from 'express';
import * as dashboardController from './controller';
import { authenticate, authorize } from '../../middlewares';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistics
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard statistics (AGENT, ADMIN)
 *     description: Returns ticket counts by status, priority, and recent tickets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       403:
 *         description: Insufficient role
 */
router.get('/stats', authenticate, dashboardController.getStats);

export default router;
