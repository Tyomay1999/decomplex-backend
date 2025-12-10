import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthError } from "../errors/AuthError";

interface TokenPayload {
  sub: string;
  company?: string;
  position?: string;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new AuthError("Authorization header is missing");
  }

  const token = header.slice(7).trim();

  const decoded = jwt.verify(token, env.jwtSecret) as TokenPayload;

  req.auth = { userId: decoded.sub };

  next();
}
