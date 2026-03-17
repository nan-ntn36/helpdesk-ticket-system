import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import * as usersService from './service';

export async function getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await usersService.getUsers(page, limit);

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUserById(parseInt(req.params.id as string));
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.createUser(req.body);
    res.status(201).json({ success: true, message: 'User created', data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateUser(parseInt(req.params.id as string), req.body);
    res.json({ success: true, message: 'User updated', data: user });
  } catch (error) {
    next(error);
  }
}
