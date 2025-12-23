import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";

import { createCandidate, CandidateEntity } from "../../../database/methods/candidateMethods";

import { conflict } from "../../../errors/DomainError";
import type { LocaleCode } from "../../../domain/types";

interface RegisterCandidateBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  language?: LocaleCode;
  fingerprint?: string;
}

export async function registerCandidateAction(
  req: Request<unknown, unknown, RegisterCandidateBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const {
    email,
    password,
    firstName,
    lastName,
    language,
    fingerprint: fingerprintFromBody,
  } = req.body;

  const fingerprint = fingerprintFromBody ?? req.fingerprint?.hash ?? null;

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const candidate: CandidateEntity = await createCandidate({
      email,
      passwordHash,
      firstName,
      lastName,
      language,
    });

    res.status(201).json({
      success: true,
      data: {
        id: candidate.id,
        email: candidate.email,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        language: candidate.language,
        fingerprint,
      },
    });
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      err.name === "SequelizeUniqueConstraintError"
    ) {
      return next(
        conflict("CANDIDATE_EMAIL_CONFLICT", "Candidate email already exists", { email }),
      );
    }

    next(err);
  }
}
