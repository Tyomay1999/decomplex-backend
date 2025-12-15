import type { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { validationFailed } from "../../../errors/DomainError";

const loginSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fingerprint: Joi.string().trim().allow("").optional(),
  rememberUser: Joi.boolean().optional().default(false),
});

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const { error, value } = loginSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return next(
      validationFailed("Invalid login payload", {
        details: error.details,
      }),
    );
  }

  req.body = value;
  return next();
}
