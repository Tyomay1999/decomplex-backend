import type { Request, Response, NextFunction } from "express";
import { getVacancyById, updateVacancyById } from "../../../database/methods/vacancyMethods";
import { notFound, unauthorized } from "../../../errors/DomainError";

export async function archiveVacancyAction(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const user = req.user;

    if (!user || user.userType !== "company") {
      throw unauthorized({ code: "COMPANY_REQUIRED", message: "Company access required" });
    }

    const vacancy = await getVacancyById(req.params.id);

    if (!vacancy) {
      throw notFound("VACANCY_NOT_FOUND", "Vacancy not found", { id: req.params.id });
    }

    if (vacancy.companyId !== user.companyId) {
      throw unauthorized({ code: "OWNERSHIP_REQUIRED", message: "Access denied" });
    }

    const archived = await updateVacancyById(req.params.id, { status: "archived" });

    if (!archived) {
      throw notFound("VACANCY_NOT_FOUND", "Vacancy not found", { id: req.params.id });
    }

    return res.status(200).json({
      success: true,
      data: {
        vacancy: archived,
      },
    });
  } catch (err) {
    next(err);
  }
}
