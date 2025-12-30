import type { Request, Response, NextFunction } from "express";
import { getVacancyById } from "../../../database/methods/vacancyMethods";
import { listApplicationsByVacancyPaged } from "../../../database/methods/applicationMethods";
import { notFound, unauthorized, validationFailed } from "../../../errors/DomainError";
import type { ApplicationStatus } from "../../../domain/types";

interface ListVacancyApplicationsQuery {
  limit?: string;
  cursor?: string;
  status?: ApplicationStatus;
  q?: string;
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function listVacancyApplicationsAction(
  req: Request<{ id: string }, unknown, unknown, ListVacancyApplicationsQuery>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const vacancyId = req.params.id;

    if (!vacancyId || !isUuid(vacancyId)) {
      return next(validationFailed("Invalid vacancy id", { field: "id" }));
    }

    if (!req.user || req.user.userType !== "company") {
      return next(
        unauthorized({
          code: "UNAUTHORIZED",
          message: "Company access required",
        }),
      );
    }

    const vacancy = await getVacancyById(vacancyId);
    if (!vacancy) {
      return next(notFound("UNKNOWN_DOMAIN_ERROR", "Vacancy not found"));
    }

    if (vacancy.companyId !== req.user.companyId) {
      return next(
        unauthorized({
          code: "COMPANY_REQUIRED",
          message: "You do not have access to this vacancy",
        }),
      );
    }

    const rawLimit = req.query.limit ? Number(req.query.limit) : 20;
    const limit = Number.isFinite(rawLimit) ? rawLimit : 20;

    const { items, nextCursor } = await listApplicationsByVacancyPaged({
      vacancyId,
      limit,
      cursor: req.query.cursor,
      status: req.query.status,
      q: req.query.q,
    });

    return res.status(200).json({
      success: true,
      data: {
        items,
        nextCursor,
      },
    });
  } catch (err) {
    next(err);
  }
}
