import type { Request, Response, NextFunction } from "express";
import onFinished from "on-finished";
import { httpLogger } from "../lib/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  onFinished(res, () => {
    const duration = Date.now() - start;

    httpLogger.info({
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      userAgent: req.headers["user-agent"],
      msg: "HTTP request completed",
    });
  });

  next();
}
