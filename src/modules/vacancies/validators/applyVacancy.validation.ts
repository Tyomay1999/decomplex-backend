import type { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { validationFailed } from "../../../errors/DomainError";

const paramsSchema = Joi.object({
  id: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5"] })
    .required(),
});

const bodySchema = Joi.object({
  coverLetter: Joi.string().max(5000).allow(null).optional(),
}).unknown(true);

export function validateApplyVacancy(req: Request, _res: Response, next: NextFunction): void {
  const p = paramsSchema.validate(req.params, { abortEarly: false, stripUnknown: true });
  if (p.error) {
    return next(
      validationFailed("Validation failed", {
        errors: p.error.details.map((d) => ({
          message: d.message,
          path: d.path,
          type: d.type,
        })),
      }),
    );
  }

  const b = bodySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (b.error) {
    return next(
      validationFailed("Validation failed", {
        errors: b.error.details.map((d) => ({
          message: d.message,
          path: d.path,
          type: d.type,
        })),
      }),
    );
  }

  req.body = b.value;

  if (!req.fileInfo?.url) {
    return next(
      validationFailed("Validation failed", {
        errors: [
          {
            message: "CV file is required",
            path: ["file"],
            type: "any.required",
          },
        ],
      }),
    );
  }

  return next();
}
