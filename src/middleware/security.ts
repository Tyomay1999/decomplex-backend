import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

const helmetMiddleware = helmet({
  referrerPolicy: { policy: "no-referrer" },
});

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");

  return helmetMiddleware(req, res, next);
}
