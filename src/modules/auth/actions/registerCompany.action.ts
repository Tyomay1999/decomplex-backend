import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";

import { env } from "../../../config/env";
import { getSequelize } from "../../../database";
import { createCompany, CompanyInstance } from "../../../database/methods/companyMethods";
import {
  createCompanyUser,
  CompanyUserInstance,
} from "../../../database/methods/companyUserMethods";
import { issueAuthTokens } from "../../../services/authService";
import { conflict } from "../../../errors/DomainError";
import type { LocaleCode } from "../../../domain/types";
import { JwtUserPayload } from "../../../config/jwt";

interface RegisterCompanyBody {
  name: string;
  email: string;
  password: string;
  defaultLocale?: LocaleCode;
  adminLanguage?: LocaleCode;
  fingerprint?: string;
}

export async function registerCompanyAction(
  req: Request<unknown, unknown, RegisterCompanyBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const {
    name,
    email,
    password,
    defaultLocale,
    adminLanguage,
    // fingerprint: fingerprintFromBody,
  } = req.body;

  // const fingerprint = fingerprintFromBody ?? req.fingerprint?.hash ?? null;

  const locale: LocaleCode = (defaultLocale ?? env.defaultLocale) as LocaleCode;
  const adminLang: LocaleCode = (adminLanguage ?? locale) as LocaleCode;

  const sequelize = getSequelize();
  const trx = await sequelize.transaction();

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const company: CompanyInstance = await createCompany(
      {
        name,
        email,
        passwordHash,
        defaultLocale: locale,
        status: "active",
      },
      { transaction: trx },
    );

    const adminUser: CompanyUserInstance = await createCompanyUser(
      {
        companyId: company.id,
        email,
        passwordHash,
        role: "admin",
        position: "Owner",
        language: adminLang,
      },
      { transaction: trx },
    );

    await trx.commit();

    const jwtPayload: JwtUserPayload = {
      userType: "company",
      userId: adminUser.id,
      companyId: company.id,
      email: adminUser.email,
      role: adminUser.role,
      language: adminUser.language,
      position: adminUser.position ?? null,
      fingerprint: req.fingerprint?.hash ?? null,
    };

    const { accessToken, refreshToken } = await issueAuthTokens(jwtPayload, true);

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
          language: adminUser.language,
          position: adminUser.position,
        },
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          defaultLocale: company.defaultLocale,
          status: company.status,
        },
      },
    });
  } catch (err) {
    await trx.rollback();

    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      (err as { name?: unknown }).name === "SequelizeUniqueConstraintError"
    ) {
      return next(
        conflict("COMPANY_EMAIL_CONFLICT", `Company with email=${email} already exists`, { email }),
      );
    }

    next(err);
  }
}
