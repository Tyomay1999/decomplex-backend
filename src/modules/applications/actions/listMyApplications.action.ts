import type { Request, Response, NextFunction } from "express";
import { listMyApplicationsPaged } from "../../../database/methods/applicationMethods";
import { validationFailed } from "../../../errors/DomainError";

interface ListMyApplicationsQuery {
  limit?: string;
  cursor?: string;
}

export async function listMyApplicationsAction(
  req: Request<unknown, unknown, unknown, ListMyApplicationsQuery>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    if (!req.user || req.user.userType !== "candidate") {
      return next(
        validationFailed("Candidate user required", {
          code: "UNAUTHORIZED",
        }),
      );
    }

    const rawLimit = req.query.limit ? Number(req.query.limit) : 20;
    const limit = Number.isFinite(rawLimit) ? rawLimit : 20;

    const { items, nextCursor } = await listMyApplicationsPaged({
      candidateId: req.user.id,
      limit,
      cursor: req.query.cursor,
    });

    return res.status(200).json({
      success: true,
      data: {
        items,
        nextCursor,
      },
    });
  } catch (err) {
    next(err);
  }
}
