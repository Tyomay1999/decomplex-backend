import type { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { validationFailed } from "../../../errors/DomainError";

const SUPPORTED_LOCALES = ["hy", "ru", "en"] as const;

const companyRegisterSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  defaultLocale: Joi.string()
    .valid(...SUPPORTED_LOCALES)
    .optional(),
  adminLanguage: Joi.string()
    .valid(...SUPPORTED_LOCALES)
    .optional(),
  fingerprint: Joi.string().trim().optional(),
});

export function validateCompanyRegister(req: Request, _res: Response, next: NextFunction): void {
  const { error, value } = companyRegisterSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return next(validationFailed("Invalid company registration payload", error.details));
  }

  req.body = value;
  next();
}
