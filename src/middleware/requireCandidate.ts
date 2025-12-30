import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../errors/DomainError";

export function requireCandidate(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(
      unauthorized({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      }),
    );
  }

  if (req.user.userType !== "candidate") {
    return next(
      unauthorized({
        code: "UNAUTHORIZED",
        message: "Candidate access required",
      }),
    );
  }

  return next();
}
