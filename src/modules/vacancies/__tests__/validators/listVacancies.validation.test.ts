import type { Request } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import { validateListVacancies } from "../../validators/listVacancies.validation";
import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

type Q = ParsedQs & Record<string, unknown>;

function makeR(query: Q): Request<ParamsDictionary, unknown, unknown, Q> {
  const req = makeReq() as Request<ParamsDictionary, unknown, unknown, Q>;
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

    expect(req.query).toEqual({
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
