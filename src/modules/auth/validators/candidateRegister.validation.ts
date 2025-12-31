import type { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { validationFailed } from "../../../errors/DomainError";

const SUPPORTED_LOCALES = ["am", "ru", "en"] as const;

const candidateRegisterSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  language: Joi.string()
    .valid(...SUPPORTED_LOCALES)
    .required(),
  fingerprint: Joi.string().trim().optional(),
  rememberUser: Joi.boolean().optional().default(false),
});

export function validateCandidateRegister(req: Request, _res: Response, next: NextFunction): void {
  const { error, value } = candidateRegisterSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return next(validationFailed("Invalid candidate registration payload", error.details));
  }

  req.body = value;
  next();
}
