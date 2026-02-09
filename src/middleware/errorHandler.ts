import { NextFunction, Request, Response } from "express";
import { httpLogger } from "../lib/logger";
import { AppError } from "../errors/AppError";
import { env } from "../config/env";
import { DomainError } from "../errors/DomainError";

type RequestWithId = Request & {
  requestId?: string;
};

type ErrorPayload = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function errorHandler(err: unknown, req: RequestWithId, res: Response, _next: NextFunction) {
  void _next;

  const isDev = env.nodeEnv !== "production";
  const requestId = req.requestId;

  if (err instanceof DomainError) {
    const payload: ErrorPayload = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };

    return res.status(err.statusCode).json(payload);
  }

  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else {
    appError = new AppError("Internal server error", {
      statusCode: 500,
      code: "INTERNAL_ERROR",
      isOperational: false,
    });
  }

  httpLogger.error({
    msg: "Unhandled error in request",
    requestId,
    statusCode: appError.statusCode,
    code: appError.code,
    details: appError.details,
    originalError:
      err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err,
  });

  const payload: ErrorPayload = {
    success: false,
    error: {
      code: appError?.code || "",
      message: appError.message,
    },
  };

  if (isDev && typeof appError.details !== "undefined") {
    payload.error.details = appError.details;
  }

  return res.status(appError.statusCode).json(payload);
}
