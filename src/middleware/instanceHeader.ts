import type { NextFunction, Request, Response } from "express";
import os from "os";

export function instanceHeaderMiddleware(_req: Request, res: Response, next: NextFunction) {
  const raw = process.env.INSTANCE_ID;
  const id = typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : os.hostname();
  res.setHeader("X-Instance-Id", id);
  next();
}
