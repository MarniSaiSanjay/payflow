import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Express middleware factory that validates `req.body` against the given Zod schema.
 * On success, replaces `req.body` with the parsed value. On failure, forwards the
 * `ZodError` to the error pipeline.
 */
export function validate<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };
}
