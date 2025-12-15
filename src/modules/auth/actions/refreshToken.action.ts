import type { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { validationFailed } from "../../../errors/DomainError";
import { rotateRefreshToken } from "../../../services/authService";

const schema = Joi.object({
  refreshToken: Joi.string().required(),
});

export async function refreshTokenAction(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = schema.validate(req.body);
    if (error) {
      throw validationFailed("Invalid refresh token payload", error.details);
    }

    const fingerprintHash = req.fingerprint?.hash ?? null;

    const tokens = await rotateRefreshToken(value.refreshToken, fingerprintHash);

    return res.json({
      success: true,
      data: tokens,
    });
  } catch (err) {
    next(err);
  }
}
