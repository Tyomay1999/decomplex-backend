import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/authService";
import { unauthorized } from "../errors/DomainError";

export function auth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("Authorization");

  if (!header || !header.startsWith("Bearer ")) {
    return next(
      unauthorized({
        message: "Authorization header missing",
        code: "UNAUTHORIZED",
      }),
    );
  }

  const token = header.slice("Bearer ".length).trim();
  const payload = verifyAccessToken(token);

  if (
    payload.fingerprint &&
    req.fingerprint?.hash &&
    payload.fingerprint !== req.fingerprint.hash
  ) {
    return next(
      unauthorized({
        code: "FINGERPRINT_MISMATCH",
        message: "Session fingerprint mismatch",
      }),
    );
  }

  req.auth = { userId: payload.userId };

  switch (payload.userType) {
    case "candidate": {
      req.user = {
        userType: "candidate",
        id: payload.userId,
        language: payload.language,
      };
      return next();
    }

    case "company": {
      req.user = {
        userType: "company",
        id: payload.userId,
        companyId: payload.companyId,
        position: payload.position ?? undefined,
        language: payload.language,
      };
      return next();
    }

    default: {
      return next(
        unauthorized({
          code: "INVALID_ACCESS_TOKEN",
          message: "Unknown user type",
        }),
      );
    }
  }
}
