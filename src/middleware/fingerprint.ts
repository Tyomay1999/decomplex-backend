import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";

export function fingerprintMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    undefined;

  const userAgent =
    typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined;

  const acceptLanguage =
    typeof req.headers["accept-language"] === "string" ? req.headers["accept-language"] : undefined;

  const origin = typeof req.headers.origin === "string" ? req.headers.origin : undefined;

  const referer = typeof req.headers.referer === "string" ? req.headers.referer : undefined;

  const rawFingerprintObject = {
    ip,
    userAgent,
    acceptLanguage,
    origin,
    referer,
  };

  let hash = (req.headers["x-client-fingerprint"] as string) || "";

  if (!hash) {
    const rawString = JSON.stringify(rawFingerprintObject);
    hash = crypto.createHash("sha256").update(rawString).digest("hex");
  }

  req.fingerprint = {
    hash,
    ip,
    userAgent,
    acceptLanguage,
    origin,
    referer,
  };

  logger.debug({
    msg: "Request fingerprint generated",
    requestId: req.requestId,
    fingerprintHash: hash,
  });

  return next();
}
