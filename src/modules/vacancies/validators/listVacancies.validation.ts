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
  return details.map((d) => ({
    message: d.message,
    path: d.path,
    type: d.type,
  }));
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

  const companyId = v.companyId;
  if (typeof companyId === "string") out.companyId = companyId;

  const status = v.status;
  if (status === "active" || status === "archived") out.status = status;

  const jobType = v.jobType;
  if (
    jobType === "full_time" ||
    jobType === "part_time" ||
    jobType === "remote" ||
    jobType === "hybrid"
  ) {
    out.jobType = jobType;
  }

  const q = v.q;
  if (typeof q === "string") out.q = q;

  const limit = v.limit;
  if (typeof limit === "number") out.limit = limit;

  const cursor = v.cursor;
  if (typeof cursor === "string") out.cursor = cursor;

  return out;
}

export function validateListVacancies(req: Request, _res: Response, next: NextFunction): void {
  const { error, value } = querySchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return next(
      validationFailed("Validation failed", {
        errors: toIssues(error.details as unknown as JoiDetail[]),
      }),
    );
  }

  req.query = pickQuery(value) as unknown as Request["query"];
  return next();
}
