import type { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { validationFailed } from "../../../errors/DomainError";

const paramsSchema = Joi.object({
  id: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5"] })
    .required(),
});

const querySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).optional(),
  cursor: Joi.string().max(2000).optional(),
  status: Joi.string().optional(),
  q: Joi.string().trim().max(200).optional().allow(""),
}).unknown(true);

type JoiDetail = {
  message: string;
  path: Array<string | number>;
  type: string;
};

function toIssues(details: JoiDetail[]): JoiDetail[] {
  return details.map((d) => ({ message: d.message, path: d.path, type: d.type }));
}

type NormalizedQuery = {
  limit?: number;
  cursor?: string;
  status?: string;
  q?: string;
};

function pickQuery(value: unknown): NormalizedQuery {
  if (typeof value !== "object" || value === null) return {};
  const v = value as Record<string, unknown>;

  const out: NormalizedQuery = {};

  if (typeof v.limit === "number") out.limit = v.limit;
  if (typeof v.cursor === "string") out.cursor = v.cursor;
  if (typeof v.status === "string") out.status = v.status;
  if (typeof v.q === "string") out.q = v.q;

  return out;
}

export function validateListVacancyApplications(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const p = paramsSchema.validate(req.params, {
    abortEarly: false,
    stripUnknown: true,
    convert: false,
  });

  if (p.error) {
    next(
      validationFailed("Validation failed", {
        errors: toIssues(p.error.details as unknown as JoiDetail[]),
      }),
    );
    return;
  }

  const q = querySchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (q.error) {
    next(
      validationFailed("Validation failed", {
        errors: toIssues(q.error.details as unknown as JoiDetail[]),
      }),
    );
    return;
  }

  req.validatedParams = { id: (p.value as { id: string }).id };
  req.validatedVacancyApplicationsQuery = pickQuery(q.value);

  next();
}
