import type { NextFunction, Request, Response } from "express";
import { validationFailed } from "../../../errors/DomainError";

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export function validateApplyVacancy(req: Request, _res: Response, next: NextFunction): void {
  const vacancyId = req.params.id;

  if (!vacancyId || !isUuid(vacancyId)) {
    return next(
      validationFailed("Invalid vacancy id", {
        field: "id",
      }),
    );
  }

  const coverLetterRaw = req.body?.coverLetter;
  if (coverLetterRaw !== undefined && coverLetterRaw !== null) {
    if (typeof coverLetterRaw !== "string") {
      return next(
        validationFailed("coverLetter must be a string", {
          field: "coverLetter",
        }),
      );
    }

    if (coverLetterRaw.length > 5000) {
      return next(
        validationFailed("coverLetter is too long (max 5000 chars)", {
          field: "coverLetter",
          max: 5000,
        }),
      );
    }
  }

  const file = req.files && (req.files as { file?: unknown }).file;
  if (!file && !req?.fileInfo?.path) {
    return next(
      validationFailed("CV file is required", {
        field: "file",
      }),
    );
  }

  return next();
}
