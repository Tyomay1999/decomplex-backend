import type { Request, Response, NextFunction } from "express";
import { createVacancy } from "../../../database/methods/vacancyMethods";
import type { VacancyJobType } from "../../../domain/types";
import { unauthorized } from "../../../errors/DomainError";

interface CreateVacancyBody {
  title: string;
  description: string;
  salaryFrom?: number | null;
  salaryTo?: number | null;
  jobType: VacancyJobType;
  location?: string | null;
}

export async function createVacancyAction(
  req: Request<unknown, unknown, CreateVacancyBody>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const user = req.user;

    if (!user || user.userType !== "company") {
      throw unauthorized({ code: "COMPANY_REQUIRED", message: "Company access required" });
    }

    const vacancy = await createVacancy({
      companyId: user.companyId,
      createdById: user.id,
      title: req.body.title,
      description: req.body.description,
      salaryFrom: req.body.salaryFrom ?? null,
      salaryTo: req.body.salaryTo ?? null,
      jobType: req.body.jobType,
      location: req.body.location ?? null,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      data: {
        vacancy,
      },
    });
  } catch (err) {
    next(err);
  }
}
