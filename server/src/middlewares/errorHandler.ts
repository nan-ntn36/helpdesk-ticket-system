import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors';
import { logger } from '../lib/logger';
import { env } from '../config/env';
import { ApiResponse } from '../common/types';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void {
  // Log error
  if (err instanceof AppError && err.isOperational) {
    logger.warn({ err, statusCode: err.statusCode }, err.message);
  } else {
    logger.error({ err }, 'Unexpected error');
  }

  // Operational error (expected)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unexpected error
  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
}
