import type { Request, Response, NextFunction } from "express";
import { getVacancyById } from "../../../database/methods/vacancyMethods";
import { listApplicationsByVacancyPaged } from "../../../database/methods/applicationMethods";
import { notFound, unauthorized } from "../../../errors/DomainError";
import type { ApplicationStatus } from "../../../domain/types";

interface ListVacancyApplicationsQuery {
  limit?: string;
  cursor?: string;
  status?: ApplicationStatus;
  q?: string;
}

function toSafeLimit(raw?: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 20;
  return Math.min(50, Math.floor(n));
}

export async function listVacancyApplicationsAction(
  req: Request<{ id: string }, unknown, unknown, ListVacancyApplicationsQuery>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    if (!req.user || req.user.userType !== "company") {
      throw unauthorized({ code: "COMPANY_REQUIRED", message: "Company access required" });
    }

    const vacancyId = req.params.id;

    const vacancy = await getVacancyById(vacancyId);
    if (!vacancy) {
      throw notFound("VACANCY_NOT_FOUND", "Vacancy not found", { id: vacancyId });
    }

    if (vacancy.companyId !== req.user.companyId) {
      throw unauthorized({ code: "OWNERSHIP_REQUIRED", message: "Access denied" });
    }

    const limit = toSafeLimit(req.query.limit);

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
