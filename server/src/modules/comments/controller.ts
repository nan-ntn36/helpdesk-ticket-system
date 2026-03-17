import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import * as commentsService from './service';

export async function getComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const comments = await commentsService.getComments(parseInt(req.params.ticketId as string));
    res.json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
}

export async function createComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const comment = await commentsService.createComment(
      parseInt(req.params.ticketId as string),
      req.body,
      req.user!.userId
    );
    res.status(201).json({ success: true, message: 'Comment added', data: comment });
  } catch (error) {
    next(error);
  }
}
