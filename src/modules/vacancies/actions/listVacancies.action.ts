import type { Request, Response, NextFunction } from "express";
import { listVacanciesPaged } from "../../../database/methods/vacancyMethods";
import type { VacancyJobType, VacancyStatus } from "../../../domain/types";

interface ListVacanciesQuery {
  companyId?: string;
  status?: VacancyStatus;
  jobType?: VacancyJobType;

  q?: string;
  limit?: string;
  cursor?: string;
}

function toSafeLimit(raw?: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 20;
  return Math.min(50, Math.floor(n));
}

export async function listVacanciesAction(
  req: Request<unknown, unknown, unknown, ListVacanciesQuery>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { companyId, status, jobType, q, cursor } = req.query;
    const limit = toSafeLimit(req.query.limit);

    const result = await listVacanciesPaged({
      companyId,
      status,
      jobType,
      q,
      limit,
      cursor,
    });

    return res.status(200).json({
      success: true,
      data: {
        vacancies: result.items,
        nextCursor: result.nextCursor,
      },
    });
  } catch (err) {
    next(err);
  }
}
