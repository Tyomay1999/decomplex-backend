import type { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { validationFailed, unauthorized } from "../../../errors/DomainError";
import { revokeTokens } from "../../../services/authService";

const schema = Joi.object({
  refreshToken: Joi.string().optional(),
});

export async function logoutAction(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    if (!req.user) {
      return next(
        unauthorized({
          code: "UNAUTHORIZED",
          message: "User is not authenticated",
        }),
      );
    }

    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      throw validationFailed("Invalid logout payload", error.details);
    }

    const fingerprintHash = req.fingerprint?.hash ?? null;

    await revokeTokens(req.user.id, fingerprintHash);

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
}
