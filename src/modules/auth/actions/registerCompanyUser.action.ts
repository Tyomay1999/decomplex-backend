import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";

import {
  createCompanyUser,
  CompanyUserInstance,
} from "../../../database/methods/companyUserMethods";
import { unauthorized, conflict } from "../../../errors/DomainError";
import type { CompanyUserRole, LocaleCode } from "../../../domain/types";

interface RegisterCompanyUserBody {
  email: string;
  password: string;
  role: CompanyUserRole; // "admin" | "recruiter"
  position?: string;
  language: LocaleCode;
}

export async function registerCompanyUserAction(
  req: Request<unknown, unknown, RegisterCompanyUserBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authUser = req.user;
  const companyId = authUser?.userType === "company" ? authUser.companyId : undefined;

  if (!companyId) {
    return next(
      unauthorized({
        code: "COMPANY_REQUIRED",
        message: "Authenticated company user required",
      }),
    );
  }

  const { email, password, role, position, language } = req.body;

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const user: CompanyUserInstance = await createCompanyUser({
      companyId,
      email,
      passwordHash,
      role,
      position: position ?? null,
      language,
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        position: user.position,
        language: user.language,
        companyId: user.companyId,
      },
    });
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      (err as { name?: unknown }).name === "SequelizeUniqueConstraintError"
    ) {
      return next(
        conflict("COMPANY_USER_EMAIL_CONFLICT", `Company user with email=${email} already exists`, {
          email,
          companyId,
        }),
      );
    }

    next(err);
  }
}
