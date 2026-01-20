import type { Request } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import { validateUpdateVacancy } from "../../validators/updateVacancy.validation";
import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

type Body = {
  title?: unknown;
  description?: unknown;
  salaryFrom?: unknown;
  salaryTo?: unknown;
  jobType?: unknown;
  location?: unknown;
  status?: unknown;
} & Record<string, unknown>;

function makeR(body: Body): Request<ParamsDictionary, unknown, Body, ParsedQs> {
  const req = makeReq() as Request<ParamsDictionary, unknown, Body, ParsedQs>;
  req.body = body;
  return req;
}

describe("validateUpdateVacancy", () => {
  test("strips unknown fields and keeps only allowed payload", () => {
    const req = makeR({
      title: "abc",
      location: "",
      status: "archived",
      extra: "x",
    });

    const res = makeRes();
    const next = makeNext();

    validateUpdateVacancy(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();

    expect(req.body).toEqual({
      title: "abc",
      location: null,
    });
  });

  test("calls next(error) when salaryFrom > salaryTo", () => {
    const req = makeR({
      salaryFrom: 10,
      salaryTo: 1,
    });

    const res = makeRes();
    const next = makeNext();

    validateUpdateVacancy(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test("calls next(error) when invalid types", () => {
    const req = makeR({
      salaryFrom: "x",
    });

    const res = makeRes();
    const next = makeNext();

    validateUpdateVacancy(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
