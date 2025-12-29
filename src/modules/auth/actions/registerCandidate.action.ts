import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";

import { env } from "../../../config/env";
import { getSequelize } from "../../../database";
import { createCandidate, CandidateEntity } from "../../../database/methods/candidateMethods";
import { conflict } from "../../../errors/DomainError";
import type { LocaleCode } from "../../../domain/types";

import { issueAuthTokens } from "../../../services/authService";
import type { JwtUserPayload } from "../../../config/jwt";

interface RegisterCandidateBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  language?: LocaleCode;
  rememberUser?: boolean;
}

export async function registerCandidateAction(
  req: Request<unknown, unknown, RegisterCandidateBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { email, password, firstName, lastName } = req.body;

  const locale: LocaleCode = (req.body.language ?? env.defaultLocale) as LocaleCode;
  const rememberUser = req.body.rememberUser ?? true;

  const fingerprint = req.fingerprint?.hash ?? null;

  const sequelize = getSequelize();
  const trx = await sequelize.transaction();

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const candidate: CandidateEntity = await createCandidate(
      {
        email,
        passwordHash,
        firstName,
        lastName,
        language: locale,
      },
      { transaction: trx },
    );

    await trx.commit();

    const jwtPayload: JwtUserPayload = {
      userType: "candidate",
      userId: candidate.id,
      email: candidate.email,
      role: "candidate",
      language: candidate.language,
      fingerprint,
    };

    const tokens = await issueAuthTokens(jwtPayload, rememberUser);

    res.status(201).json({
      success: true,
      data: {
        ...tokens,
        fingerprintHash: fingerprint,
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
    await trx.rollback();

    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      (err as { name?: unknown }).name === "SequelizeUniqueConstraintError"
    ) {
      return next(
        conflict("CANDIDATE_EMAIL_CONFLICT", "Candidate email already exists", { email }),
      );
    }

    next(err);
  }
}
