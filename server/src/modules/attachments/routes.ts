import { Router } from 'express';
import multer from 'multer';
import * as attachmentsController from './controller';
import { authenticate } from '../../middlewares';
import { MAX_FILE_SIZE, ALLOWED_MIMES } from './service';
import { BadRequestError } from '../../common/errors';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError(`File type ${file.mimetype} not allowed`) as any, false);
    }
  },
});

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Attachments
 *   description: File attachments for tickets
 */

/**
 * @swagger
 * /tickets/{ticketId}/attachments:
 *   get:
 *     tags: [Attachments]
 *     summary: Get attachments for a ticket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of attachments
 */
router.get('/', authenticate, attachmentsController.getAttachments);

/**
 * @swagger
 * /tickets/{ticketId}/attachments:
 *   post:
 *     tags: [Attachments]
 *     summary: Upload file attachment
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded
 *       400:
 *         description: Invalid file type or size
 */
router.post('/', authenticate, upload.single('file'), attachmentsController.uploadAttachment);

export default router;

// Separate router for download (not nested under tickets)
export const attachmentDownloadRouter = Router();

/**
 * @swagger
 * /attachments/{id}/download:
 *   get:
 *     tags: [Attachments]
 *     summary: Download attachment file
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: File download
 *       404:
 *         description: Attachment not found
 */
attachmentDownloadRouter.get('/:id/download', authenticate, attachmentsController.downloadAttachment);
