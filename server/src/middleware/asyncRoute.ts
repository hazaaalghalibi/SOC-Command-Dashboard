import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Express 4 does not forward Promise rejections from async route handlers to `next(err)`.
 * Wrap any route that uses `async` (or returns a Promise) so failures reach the global JSON error handler.
 */
export function asyncRoute(
  fn: (req: Request, res: Response, next: NextFunction) => unknown,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      void Promise.resolve(fn(req, res, next)).catch(next);
    } catch (err) {
      next(err);
    }
  };
}
