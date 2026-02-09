import type { Request } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";

import { validateListVacancies } from "../../validators/listVacancies.validation";
import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

type Q = ParsedQs & Record<string, unknown>;

type ValidatedQuery = {
  companyId?: string;
  status?: "active" | "archived";
  jobType?: "full_time" | "part_time" | "remote" | "hybrid";
  q?: string;
  limit?: number;
  cursor?: string;
};

type ReqExt = Request<ParamsDictionary, unknown, unknown, Q> & {
  validatedQuery?: ValidatedQuery;
};

function makeR(query: Q): ReqExt {
  const req = makeReq() as unknown as ReqExt;
  req.query = query;
  return req;
}

describe("validateListVacancies", () => {
  test("strips unknown fields and normalizes query", () => {
    const req = makeR({
      companyId: "11111111-1111-4111-8111-111111111111",
      status: "active",
      jobType: "remote",
      limit: "10",
      q: " x ",
      extra: "x",
    });

    const res = makeRes();
    const next = makeNext();

    validateListVacancies(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();

    expect(req.validatedQuery).toEqual({
      companyId: "11111111-1111-4111-8111-111111111111",
      status: "active",
      jobType: "remote",
      q: "x",
      limit: 10,
    });
  });

  test("calls next(error) when invalid query", () => {
    const req = makeR({
      limit: "0",
      status: "bad",
    });

    const res = makeRes();
    const next = makeNext();

    validateListVacancies(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
