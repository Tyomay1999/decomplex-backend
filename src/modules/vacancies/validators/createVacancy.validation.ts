import type { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { validationFailed } from "../../../errors/DomainError";

const schema = Joi.object({
  title: Joi.string().trim().min(3).max(255).required(),
  description: Joi.string().trim().min(10).required(),
  salaryFrom: Joi.number().integer().min(0).allow(null),
  salaryTo: Joi.number().integer().min(0).allow(null),
  jobType: Joi.string().valid("full_time", "part_time", "remote", "hybrid").required(),
  location: Joi.string().trim().max(255).allow(null).empty("").default(null),
}).custom((value, helpers) => {
  const v = value as { salaryFrom?: number | null; salaryTo?: number | null };
  if (v.salaryFrom != null && v.salaryTo != null && v.salaryFrom > v.salaryTo) {
    return helpers.message({ info: "salaryFrom must be less than or equal to salaryTo" });
  }
  return value;
});

export function validateCreateVacancy(req: Request, _res: Response, next: NextFunction) {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

  if (error) {
    return next(
      validationFailed("Validation failed", {
        errors: error.details.map((d) => ({
          message: d.message,
          path: d.path,
          type: d.type,
        })),
      }),
    );
  }

  req.body = value;
  return next();
}
