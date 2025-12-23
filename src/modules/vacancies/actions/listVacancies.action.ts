import type { Request, Response, NextFunction } from "express";
import { listVacancies } from "../../../database/methods/vacancyMethods";
import type { VacancyJobType, VacancyStatus } from "../../../domain/types";

interface ListVacanciesQuery {
  companyId?: string;
  status?: VacancyStatus;
  jobType?: VacancyJobType;
}

export async function listVacanciesAction(
  req: Request<unknown, unknown, unknown, ListVacanciesQuery>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { companyId, status, jobType } = req.query;

    const vacancies = await listVacancies({
      companyId,
      status,
      jobType,
    });

    return res.status(200).json({
      success: true,
      data: {
        vacancies,
      },
    });
  } catch (err) {
    next(err);
  }
}
