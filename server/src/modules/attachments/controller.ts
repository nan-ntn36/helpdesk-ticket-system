import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import { BadRequestError } from '../../common/errors';
import * as attachmentsService from './service';

export async function getAttachments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const attachments = await attachmentsService.getAttachments(parseInt(req.params.ticketId as string));
    res.json({ success: true, data: attachments });
  } catch (error) {
    next(error);
  }
}

export async function uploadAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new BadRequestError('File is required');
    }

    const attachment = await attachmentsService.uploadAttachment(
      parseInt(req.params.ticketId as string),
      req.file
    );
    res.status(201).json({ success: true, message: 'File uploaded', data: attachment });
  } catch (error) {
    next(error);
  }
}

export async function downloadAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { attachment, filePath } = await attachmentsService.getAttachmentFile(
      parseInt(req.params.id as string)
    );

    res.setHeader('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
    res.setHeader('Content-Type', attachment.mimeType);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
}
