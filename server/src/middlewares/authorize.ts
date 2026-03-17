import { Response, NextFunction } from 'express';
import { ForbiddenError } from '../common/errors';
import { AuthenticatedRequest } from '../common/types';

/**
 * Authorize by role names.
 * Usage: authorize('ADMIN', 'AGENT')
 */
export function authorize(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Not authenticated'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient role'));
      return;
    }

    next();
  };
}

/**
 * Authorize by permission names.
 * Usage: authorizePermissions('ticket.create', 'ticket.read.all')
 */
export function authorizePermissions(...requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Not authenticated'));
      return;
    }

    const hasAll = requiredPermissions.every(p => req.user!.permissions.includes(p));
    if (!hasAll) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}
