import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { notFound, unauthorized as unauthorizedError } from "../../../errors/DomainError";

import {
  findCompanyUsersByEmail,
  CompanyUserInstance,
} from "../../../database/methods/companyUserMethods";
import type { Company } from "../../../database/models/Company";

import {
  getCandidateAuthByEmail,
  CandidateAuthEntity,
} from "../../../database/methods/candidateMethods";
import { issueAuthTokens, tokensT } from "../../../services/authService";
import type { JwtUserPayload } from "../../../config/jwt";
import { httpLogger } from "../../../lib/logger";

type CompanyUserWithCompany = CompanyUserInstance & { company?: Company };

interface LoginBody {
  email: string;
  password: string;
  fingerprint?: string;
  rememberUser?: boolean;
}

export async function loginAction(
  req: Request<unknown, unknown, LoginBody>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { email, password, rememberUser } = req.body;

    const fingerprint = req.fingerprint?.hash ?? null;

    const companyUsers = (await findCompanyUsersByEmail(email, {
      include: ["company"],
    })) as CompanyUserWithCompany[];

    if (companyUsers.length === 1) {
      const record = companyUsers[0];
      const user = record;
      const company = record.company;

      if (!company) {
        throw notFound("COMPANY_NOT_FOUND", "Company not found for this user", { userId: user.id });
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        throw unauthorizedError({
          message: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        });
      }

      const jwtPayload: JwtUserPayload = {
        userType: "company",
        userId: user.id,
        companyId: company.id,
        email: user.email,
        role: user.role,
        language: user.language,
        position: user.position ?? null,
        fingerprint,
      };

      httpLogger.info(req.fingerprint?.hash);

      const tokens: tokensT = await issueAuthTokens(jwtPayload, rememberUser);

      return res.json({
        success: true,
        data: {
          fingerprintHash: req.fingerprint?.hash,
          ...tokens,
          userType: "company",
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            language: user.language,
            position: user.position,
          },
          company: {
            id: company.id,
            name: company.name,
            defaultLocale: company.defaultLocale,
            status: company.status,
          },
        },
      });
    }

    const candidate: CandidateAuthEntity | null = await getCandidateAuthByEmail(email);
    if (!candidate) {
      throw notFound("USER_NOT_FOUND", "User not found", { email });
    }

    const ok = await bcrypt.compare(password, candidate.passwordHash);
    if (!ok) {
      throw unauthorizedError({
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    const jwtPayload: JwtUserPayload = {
      userType: "candidate",
      userId: candidate.id,
      email: candidate.email,
      role: "candidate",
      language: candidate.language,
      fingerprint,
    };

    const tokens: tokensT = await issueAuthTokens(jwtPayload, rememberUser);

    return res.json({
      success: true,
      data: {
        ...tokens,
        fingerprintHash: req.fingerprint?.hash,
        userType: "candidate",
        user: {
          id: candidate.id,
          email: candidate.email,
          role: "candidate",
          language: candidate.language,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
