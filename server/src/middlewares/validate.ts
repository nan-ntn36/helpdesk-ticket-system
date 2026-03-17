import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../common/errors';

/**
 * Validate request body/query/params against a Zod schema.
 * Usage: validate(loginSchema) — validates req.body
 * Usage: validate(querySchema, 'query') — validates req.query
 */
export function validate(
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed; // Replace with parsed (coerced/transformed) data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        next(new BadRequestError(message));
      } else {
        next(error);
      }
    }
  };
}
