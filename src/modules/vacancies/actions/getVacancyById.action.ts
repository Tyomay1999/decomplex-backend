import type { Request, Response, NextFunction } from "express";
import { getVacancyById } from "../../../database/methods/vacancyMethods";
import { notFound } from "../../../errors/DomainError";

export async function getVacancyByIdAction(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const viewerCandidateId = req.user?.userType === "candidate" ? req.user.id : undefined;

    const vacancy = await getVacancyById(req.params.id, { viewerCandidateId });

    if (!vacancy) {
      throw notFound("VACANCY_NOT_FOUND", "Vacancy not found", { id: req.params.id });
    }

    return res.status(200).json({
      success: true,
      data: {
        vacancy,
      },
    });
  } catch (err) {
    next(err);
  }
}
