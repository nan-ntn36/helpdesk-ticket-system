import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import * as dashboardService from './service';

export async function getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const stats = await dashboardService.getDashboardStats(
      req.user!.userId,
      req.user!.role
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}
