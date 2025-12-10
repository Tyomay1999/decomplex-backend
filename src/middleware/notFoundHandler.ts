// src/middleware/notFoundHandler.ts
import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors/NotFoundError';

export function notFoundHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  next(new NotFoundError('Route not found'));
}
