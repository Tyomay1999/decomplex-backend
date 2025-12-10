// src/middleware/errorHandler.ts
import {
  NextFunction,
  Request,
  Response,
} from 'express';
import { httpLogger } from '../lib/logger';
import { AppError } from '../errors/AppError';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const isDev = env.nodeEnv !== 'production';
  const requestId = (req as any).requestId;

  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else {
    appError = new AppError('Internal server error', {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      isOperational: false,
    });
  }

  httpLogger.error({
    msg: 'Unhandled error in request',
    requestId,
    statusCode: appError.statusCode,
    code: appError.code,
    details: appError.details,
    originalError:
      err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : err,
  });

  const responseBody: Record<string, unknown> = {
    success: false,
    message: appError.message,
    code: appError.code,
    requestId,
  };

  if (isDev && appError.details) {
    responseBody.details = appError.details;
  }

  res.status(appError.statusCode).json(responseBody);
}
