import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import * as categoriesService from './service';

export async function getCategories(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const categories = await categoriesService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const category = await categoriesService.createCategory(req.body);
    res.status(201).json({ success: true, message: 'Category created', data: category });
  } catch (error) {
    next(error);
  }
}
