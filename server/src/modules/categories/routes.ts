import { Router } from 'express';
import * as categoriesController from './controller';
import { authenticate, authorize, validate } from '../../middlewares';
import { createCategorySchema } from './schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Ticket categories
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all categories
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', authenticate, categoriesController.getCategories);

/**
 * @swagger
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create new category (ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Network Issue" }
 *     responses:
 *       201:
 *         description: Category created
 *       409:
 *         description: Category already exists
 */
router.post('/', authenticate, authorize('ADMIN'), validate(createCategorySchema), categoriesController.createCategory);

export default router;
