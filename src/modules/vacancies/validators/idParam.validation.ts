import type { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { validationFailed } from "../../../errors/DomainError";

const schema = Joi.object({
  id: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5"] })
    .required(),
});

export function validateIdParam(req: Request, _res: Response, next: NextFunction): void {
  const { error, value } = schema.validate(req.params, { abortEarly: false, stripUnknown: true });

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

  req.params = value;
  return next();
}
