import { Router } from 'express';
import * as ticketsController from './controller';
import { authenticate, authorize, validate } from '../../middlewares';
import { createTicketSchema, updateTicketSchema, updateStatusSchema, assignTicketSchema, ticketQuerySchema } from './schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket management
 */

/**
 * @swagger
 * /tickets:
 *   get:
 *     tags: [Tickets]
 *     summary: Get tickets (role-based visibility)
 *     description: |
 *       - USER: only own tickets
 *       - AGENT: assigned + unassigned tickets
 *       - ADMIN: all tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] }
 *       - in: query
 *         name: categoryId
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, updatedAt, priority, status], default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated tickets list
 */
router.get('/', authenticate, validate(ticketQuerySchema, 'query'), ticketsController.getTickets);

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     tags: [Tickets]
 *     summary: Get ticket by ID (with comments & history)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Ticket details with comments and history
 *       403:
 *         description: Ownership denied (USER role)
 *       404:
 *         description: Ticket not found
 */
router.get('/:id', authenticate, ticketsController.getTicketById);

/**
 * @swagger
 * /tickets:
 *   post:
 *     tags: [Tickets]
 *     summary: Create new ticket
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title: { type: string, example: "Cannot login to system" }
 *               description: { type: string, example: "I am getting an error when trying to login with my credentials" }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT], default: MEDIUM }
 *               categoryId: { type: integer, example: 1 }
 *     responses:
 *       201:
 *         description: Ticket created
 */
router.post('/', authenticate, validate(createTicketSchema), ticketsController.createTicket);

/**
 * @swagger
 * /tickets/{id}:
 *   patch:
 *     tags: [Tickets]
 *     summary: Update ticket (AGENT, ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] }
 *               categoryId: { type: integer, nullable: true }
 *     responses:
 *       200:
 *         description: Ticket updated (changes recorded in history)
 */
router.patch('/:id', authenticate, authorize('AGENT', 'ADMIN'), validate(updateTicketSchema), ticketsController.updateTicket);

/**
 * @swagger
 * /tickets/{id}/status:
 *   patch:
 *     tags: [Tickets]
 *     summary: Update ticket status (AGENT, ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', authenticate, authorize('AGENT', 'ADMIN'), validate(updateStatusSchema), ticketsController.updateStatus);

/**
 * @swagger
 * /tickets/{id}/assign:
 *   patch:
 *     tags: [Tickets]
 *     summary: Assign ticket to agent (ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assignedToId]
 *             properties:
 *               assignedToId: { type: integer, nullable: true, example: 2 }
 *     responses:
 *       200:
 *         description: Ticket assigned
 */
router.patch('/:id/assign', authenticate, authorize('ADMIN'), validate(assignTicketSchema), ticketsController.assignTicket);

// ─── Delete All Tickets (ADMIN only) ─────────────────
router.delete('/all', authenticate, authorize('ADMIN'), ticketsController.deleteAllTickets);

// ─── Delete Ticket (ADMIN only) ──────────────────────
router.delete('/:id', authenticate, authorize('ADMIN'), ticketsController.deleteTicket);

export default router;
