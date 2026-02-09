import type { Request, Response, NextFunction } from "express";
import { getVacancyById } from "../../../database/methods/vacancyMethods";
import { listApplicationsByVacancyPaged } from "../../../database/methods/applicationMethods";
import { notFound, unauthorized } from "../../../errors/DomainError";
import type { ApplicationStatus } from "../../../domain/types";

function toSafeLimit(raw?: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) return 20;
  return Math.min(50, Math.floor(raw));
}

export async function listVacancyApplicationsAction(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    if (!req.user || req.user.userType !== "company") {
      throw unauthorized({ code: "COMPANY_REQUIRED", message: "Company access required" });
    }

    const vacancyId = req.validatedParams?.id;
    if (!vacancyId) {
      throw notFound("VACANCY_NOT_FOUND", "Vacancy not found", { id: null });
    }

    const vacancy = await getVacancyById(vacancyId);
    if (!vacancy) {
      throw notFound("VACANCY_NOT_FOUND", "Vacancy not found", { id: vacancyId });
    }

    if (vacancy.companyId !== req.user.companyId) {
      throw unauthorized({ code: "OWNERSHIP_REQUIRED", message: "Access denied" });
    }

    const q = req.validatedVacancyApplicationsQuery ?? {};
    const limit = toSafeLimit(q.limit);

    const { items, nextCursor } = await listApplicationsByVacancyPaged({
      vacancyId,
      limit,
      cursor: q.cursor,
      status: q.status as ApplicationStatus | undefined,
      q: q.q,
    });

    return res.status(200).json({
      success: true,
      data: { items, nextCursor },
    });
  } catch (err) {
    next(err);
  }
}
