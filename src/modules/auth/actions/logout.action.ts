import type { Request, Response, NextFunction } from "express";
import { getRedisClient } from "../../../messaging/redis/client";
import { unauthorized } from "../../../errors/DomainError";

export async function logoutAction(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const user = req.user;

    if (!user) {
      return next(
        unauthorized({
          code: "UNAUTHORIZED",
          message: "User is not authenticated",
        }),
      );
    }

    const redis = getRedisClient();

    const { refreshToken } = req.body as { refreshToken?: string };

    if (refreshToken) {
      await redis.del(`refresh:${refreshToken}`);
    }

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
}
