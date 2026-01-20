import type { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { validationFailed } from "../../../errors/DomainError";

const SUPPORTED_LOCALES = ["hy", "ru", "en"] as const;
const SUPPORTED_ROLES = ["admin", "recruiter"] as const;

const companyUserRegisterSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string()
    .valid(...SUPPORTED_ROLES)
    .required(),
  position: Joi.string().min(1).max(255).optional(),
  language: Joi.string()
    .valid(...SUPPORTED_LOCALES)
    .required(),
  fingerprint: Joi.string().trim().optional(),
});

export function validateCompanyUserRegister(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const { error, value } = companyUserRegisterSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return next(validationFailed("Invalid company user registration payload", error.details));
  }

  req.body = value;
  next();
}
