import type { Request } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import { validateListVacancyApplications } from "../../validators/listVacancyApplications.validation";
import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

type Q = ParsedQs & Record<string, unknown>;

function makeR(params: ParamsDictionary, query: Q): Request<ParamsDictionary, unknown, unknown, Q> {
  const req = makeReq() as Request<ParamsDictionary, unknown, unknown, Q>;
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

    const res = makeRes();
    const next = makeNext();

    validateListVacancyApplications(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();

    expect(req.params).toEqual({ id: "11111111-1111-4111-8111-111111111111" });
    expect(req.query).toEqual({ limit: 20, q: "x" });
  });

  test("calls next(error) when id invalid", () => {
    const req = makeR({ id: "x" }, {});

    const res = makeRes();
    const next = makeNext();

    validateListVacancyApplications(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test("calls next(error) when query invalid", () => {
    const req = makeR({ id: "11111111-1111-4111-8111-111111111111" }, { limit: "9999" });

    const res = makeRes();
    const next = makeNext();

    validateListVacancyApplications(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
