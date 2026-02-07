import type { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { validationFailed } from "../../../errors/DomainError";

const querySchema = Joi.object({
  companyId: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5"] })
    .optional(),
  status: Joi.string().valid("active", "archived").optional(),
  jobType: Joi.string().valid("full_time", "part_time", "remote", "hybrid").optional(),
  q: Joi.string().trim().max(200).optional().allow(""),
  limit: Joi.number().integer().min(1).max(50).optional(),
  cursor: Joi.string().max(2000).optional(),
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
  companyId?: string;
  status?: "active" | "archived";
  jobType?: "full_time" | "part_time" | "remote" | "hybrid";
  q?: string;
  limit?: number;
  cursor?: string;
};

function pickQuery(value: unknown): NormalizedQuery {
  if (typeof value !== "object" || value === null) return {};
  const v = value as Record<string, unknown>;

  const out: NormalizedQuery = {};

  if (typeof v.companyId === "string") out.companyId = v.companyId;
  if (v.status === "active" || v.status === "archived") out.status = v.status;

  if (
    v.jobType === "full_time" ||
    v.jobType === "part_time" ||
    v.jobType === "remote" ||
    v.jobType === "hybrid"
  ) {
    out.jobType = v.jobType;
  }

  if (typeof v.q === "string") out.q = v.q;
  if (typeof v.limit === "number") out.limit = v.limit;
  if (typeof v.cursor === "string") out.cursor = v.cursor;

  return out;
}

export function validateListVacancies(req: Request, _res: Response, next: NextFunction): void {
  const { error, value } = querySchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    next(
      validationFailed("Validation failed", {
        errors: toIssues(error.details as unknown as JoiDetail[]),
      }),
    );
    return;
  }

  req.validatedQuery = pickQuery(value);
  next();
}
