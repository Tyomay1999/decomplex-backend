import type { Request, Response, NextFunction } from "express";
import { getVacancyById, updateVacancyById } from "../../../database/methods/vacancyMethods";
import { notFound, unauthorized } from "../../../errors/DomainError";

export async function archiveVacancyAction(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.user;

    if (!user || user.userType !== "company") {
      throw unauthorized({ code: "COMPANY_REQUIRED", message: "Company user required" });
    }

    const vacancy = await getVacancyById(req.params.id);

    if (!vacancy) {
      throw notFound("UNKNOWN_DOMAIN_ERROR", "Vacancy not found", { id: req.params.id });
    }

    if (vacancy.companyId !== user.companyId) {
      throw unauthorized({
        code: "UNAUTHORIZED",
        message: "You cannot archive vacancies of another company",
      });
    }

    const archived = await updateVacancyById(req.params.id, {
      status: "archived",
    });

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
