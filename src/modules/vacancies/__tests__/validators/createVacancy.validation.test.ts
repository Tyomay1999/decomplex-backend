import type { Request } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import { validateCreateVacancy } from "../../validators/createVacancy.validation";
import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

type Body = {
  title?: unknown;
  description?: unknown;
  salaryFrom?: unknown;
  salaryTo?: unknown;
  jobType?: unknown;
  location?: unknown;
} & Record<string, unknown>;

function makeR(body: Body): Request<ParamsDictionary, unknown, Body, ParsedQs> {
  const req = makeReq() as Request<ParamsDictionary, unknown, Body, ParsedQs>;
  req.body = body;
  return req;
}

describe("validateCreateVacancy", () => {
  test("strips unknown fields and normalizes location", () => {
    const req = makeR({
      title: "abc",
      description: "0123456789",
      salaryFrom: null,
      salaryTo: null,
      jobType: "remote",
      location: "",
      extra: "x",
    });

    const res = makeRes();
    const next = makeNext();

    validateCreateVacancy(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();

    expect(req.body).toEqual({
      title: "abc",
      description: "0123456789",
      salaryFrom: null,
      salaryTo: null,
      jobType: "remote",
      location: null,
    });
  });

  test("calls next(error) when payload invalid", () => {
    const req = makeR({
      title: "a",
      description: "x",
      jobType: "bad",
    });

    const res = makeRes();
    const next = makeNext();

    validateCreateVacancy(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test("calls next(error) when salaryFrom > salaryTo", () => {
    const req = makeR({
      title: "abc",
      description: "0123456789",
      salaryFrom: 10,
      salaryTo: 1,
      jobType: "remote",
      location: null,
    });

    const res = makeRes();
    const next = makeNext();

    validateCreateVacancy(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
