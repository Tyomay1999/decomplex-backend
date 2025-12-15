import type { Request, Response, NextFunction } from "express";

export async function getCurrentUserAction(req: Request, res: Response, next: NextFunction) {
  try {
    return res.status(200).json({
      success: true,
      data: {
        user: req.user ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
}
