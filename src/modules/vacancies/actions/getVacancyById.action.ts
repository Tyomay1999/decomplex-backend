import type { Request, Response, NextFunction } from "express";
import { getVacancyById } from "../../../database/methods/vacancyMethods";
import { notFound } from "../../../errors/DomainError";

export async function getVacancyByIdAction(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const vacancy = await getVacancyById(req.params.id);

    if (!vacancy) {
      throw notFound("UNKNOWN_DOMAIN_ERROR", "Vacancy not found", {
        id: req.params.id,
      });
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
