import { Router } from 'express';
import * as commentsController from './controller';
import { authenticate, validate } from '../../middlewares';
import { createCommentSchema } from './schema';

const router = Router({ mergeParams: true }); // Access :ticketId from parent

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Ticket comments
 */

/**
 * @swagger
 * /tickets/{ticketId}/comments:
 *   get:
 *     tags: [Comments]
 *     summary: Get comments for a ticket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of comments
 *       404:
 *         description: Ticket not found
 */
router.get('/', authenticate, commentsController.getComments);

/**
 * @swagger
 * /tickets/{ticketId}/comments:
 *   post:
 *     tags: [Comments]
 *     summary: Add comment to ticket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: "Working on this issue now" }
 *     responses:
 *       201:
 *         description: Comment added
 *       404:
 *         description: Ticket not found
 */
router.post('/', authenticate, validate(createCommentSchema), commentsController.createComment);

export default router;
