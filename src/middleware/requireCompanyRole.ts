import type { Request, Response, NextFunction } from "express";
import { unauthorized } from "../errors/DomainError";

export function requireCompanyRole(roles: Array<"admin" | "recruiter">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || user.userType !== "company") {
      return next(unauthorized({ code: "COMPANY_REQUIRED", message: "Company user required" }));
    }

    if (!roles.includes(user.role)) {
      return next(unauthorized({ code: "UNAUTHORIZED", message: "Insufficient permissions" }));
    }

    return next();
  };
}
