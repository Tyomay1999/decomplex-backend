import type { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { validationFailed } from "../../../errors/DomainError";

const schema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().min(10).optional(),
  salaryFrom: Joi.number().integer().min(0).allow(null).optional(),
  salaryTo: Joi.number().integer().min(0).allow(null).optional(),
  jobType: Joi.string().valid("full_time", "part_time", "remote", "hybrid").optional(),
  location: Joi.string().max(255).allow(null).optional(),
  status: Joi.string().valid("active", "archived").optional(),
}).custom((value, helpers) => {
  if (value.salaryFrom != null && value.salaryTo != null && value.salaryFrom > value.salaryTo) {
    return helpers.error("any.invalid");
  }
  return value;
});

export function validateUpdateVacancy(req: Request, _res: Response, next: NextFunction) {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return next(
      validationFailed("Validation failed", {
        errors: error.details,
      }),
    );
  }

  req.body = value;
  return next();
}
