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
  return details.map((d) => ({
    message: d.message,
    path: d.path,
    type: d.type,
  }));
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

  const limit = v.limit;
  if (typeof limit === "number") out.limit = limit;

  const cursor = v.cursor;
  if (typeof cursor === "string") out.cursor = cursor;

  const status = v.status;
  if (typeof status === "string") out.status = status;

  const q = v.q;
  if (typeof q === "string") out.q = q;

  return out;
}

export function validateListVacancyApplications(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const p = paramsSchema.validate(req.params, { abortEarly: false, stripUnknown: true });
  if (p.error) {
    return next(
      validationFailed("Validation failed", {
        errors: toIssues(p.error.details as unknown as JoiDetail[]),
      }),
    );
  }

  const q = querySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (q.error) {
    return next(
      validationFailed("Validation failed", {
        errors: toIssues(q.error.details as unknown as JoiDetail[]),
      }),
    );
  }

  req.params = p.value as unknown as Request["params"];
  req.query = pickQuery(q.value) as unknown as Request["query"];

  return next();
}
