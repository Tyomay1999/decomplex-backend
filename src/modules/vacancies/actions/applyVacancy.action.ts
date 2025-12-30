import type { NextFunction, Request, Response } from "express";
import { getVacancyById } from "../../../database/methods/vacancyMethods";
import { createApplication } from "../../../database/methods/applicationMethods";
import { conflict, notFound, validationFailed } from "../../../errors/DomainError";

function isUniqueConstraintError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const maybe = err as { name?: unknown; parent?: unknown; original?: unknown };
  if (maybe.name === "SequelizeUniqueConstraintError") return true;

  const parent = (maybe.parent ?? maybe.original) as
    | { code?: unknown; constraint?: unknown }
    | undefined;
  if (parent && parent.code === "23505") return true;
  if (parent && parent.constraint === "applications_unique_candidate_vacancy") return true;

  return false;
}

export async function applyVacancyAction(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const vacancyId = req.params.id;

    if (!req.user || req.user.userType !== "candidate") {
      return next(validationFailed("Candidate user required"));
    }

    const vacancy = await getVacancyById(vacancyId);
    if (!vacancy) {
      return next(notFound("UNKNOWN_DOMAIN_ERROR", "Vacancy not found"));
    }

    if (!req.fileInfo?.url) {
      return next(
        validationFailed("File was not saved", {
          field: "file",
        }),
      );
    }

    const coverLetter = typeof req.body?.coverLetter === "string" ? req.body.coverLetter : null;

    try {
      const application = await createApplication({
        vacancyId,
        candidateId: req.user.id,
        cvFilePath: req.fileInfo.url,
        coverLetter,
      });

      return res.status(201).json({
        success: true,
        data: { application },
      });
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        return next(
          conflict("APPLICATION_ALREADY_EXISTS", "Application already exists for this vacancy"),
        );
      }

      throw err;
    }
  } catch (err) {
    next(err);
  }
}
