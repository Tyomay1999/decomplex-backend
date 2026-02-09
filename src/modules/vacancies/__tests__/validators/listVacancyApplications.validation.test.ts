import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";

import { validateListVacancyApplications } from "../../validators/listVacancyApplications.validation";
import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

type Q = ParsedQs & Record<string, unknown>;

type ValidatedParams = { id: string };

type ValidatedQuery = {
  limit?: number;
  cursor?: string;
  status?: string;
  q?: string;
};

type ReqExt = Request<ParamsDictionary, unknown, unknown, Q> & {
  validatedParams?: ValidatedParams;
  validatedVacancyApplicationsQuery?: ValidatedQuery;
};

function makeR(params: ParamsDictionary, query: Q): ReqExt {
  const req = makeReq() as unknown as ReqExt;
  req.params = params;
  req.query = query;
  return req;
}

describe("validateListVacancyApplications", () => {
  test("strips unknown fields and normalizes query", () => {
    const req = makeR(
      { id: "11111111-1111-4111-8111-111111111111" },
      { limit: "20", q: " x ", extra: "x" },
    );

    const res = makeRes() as unknown as Response;
    const next = makeNext() as unknown as NextFunction;

    validateListVacancyApplications(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();

    expect(req.validatedParams).toEqual({ id: "11111111-1111-4111-8111-111111111111" });
    expect(req.validatedVacancyApplicationsQuery).toEqual({ limit: 20, q: "x" });
  });

  test("calls next(error) when id invalid", () => {
    const req = makeR({ id: "x" }, {});

    const res = makeRes() as unknown as Response;
    const next = makeNext() as unknown as NextFunction;

    validateListVacancyApplications(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test("calls next(error) when query invalid", () => {
    const req = makeR({ id: "11111111-1111-4111-8111-111111111111" }, { limit: "9999" });

    const res = makeRes() as unknown as Response;
    const next = makeNext() as unknown as NextFunction;

    validateListVacancyApplications(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
