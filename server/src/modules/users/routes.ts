import { Router } from 'express';
import * as usersController from './controller';
import { authenticate, authorize, validate } from '../../middlewares';
import { createUserSchema, updateUserSchema } from './schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (ADMIN only)
 */

/**
 * @swagger
 * /users/roles:
 *   get:
 *     tags: [Users]
 *     summary: Get all roles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */
router.get('/roles', authenticate, authorize('ADMIN'), async (_req, res) => {
  const { prisma } = require('../../lib/prisma');
  const roles = await prisma.role.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
  res.json({ success: true, data: roles });
});

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users (paginated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Users list with pagination
 */
router.get('/', authenticate, authorize('ADMIN'), usersController.getUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', authenticate, authorize('ADMIN'), usersController.getUserById);

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create new user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password, roleId]
 *             properties:
 *               fullName: { type: string, example: "Jane Doe" }
 *               email: { type: string, format: email, example: "jane@example.com" }
 *               password: { type: string, example: "password123" }
 *               roleId: { type: integer, example: 2 }
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: Email already exists
 */
router.post('/', authenticate, authorize('ADMIN'), validate(createUserSchema), usersController.createUser);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user
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
 *               fullName: { type: string }
 *               email: { type: string, format: email }
 *               roleId: { type: integer }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: User updated
 */
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateUserSchema), usersController.updateUser);

export default router;
