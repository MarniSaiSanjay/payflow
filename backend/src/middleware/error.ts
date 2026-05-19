import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Application HTTP error with a stable error code and optional structured details.
 * Thrown from routes/services to produce a controlled API error response.
 */
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

/**
 * Global Express error-handling middleware.
 * Normalizes thrown errors into a consistent `{ error: { code, message, ... } }` JSON response.
 * Must be registered after all routes.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION',
        message: 'Invalid request body',
        details: err.flatten().fieldErrors,
      },
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, ...err.details },
    });
  }

  console.error('[unhandled]', err);
  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Something went wrong' },
  });
}
