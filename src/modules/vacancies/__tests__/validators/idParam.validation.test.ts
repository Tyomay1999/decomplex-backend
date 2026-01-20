import type { Request } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import { validateIdParam } from "../../validators/idParam.validation";
import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

function makeR(params: ParamsDictionary): Request<ParamsDictionary, unknown, unknown, ParsedQs> {
  const req = makeReq() as Request<ParamsDictionary, unknown, unknown, ParsedQs>;
  req.params = params;
  return req;
}

describe("validateIdParam", () => {
  test("passes when id is uuid", () => {
    const req = makeR({ id: "11111111-1111-4111-8111-111111111111" });

    const res = makeRes();
    const next = makeNext();

    validateIdParam(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.params).toEqual({ id: "11111111-1111-4111-8111-111111111111" });
  });

  test("calls next(error) when id invalid", () => {
    const req = makeR({ id: "x" });

    const res = makeRes();
    const next = makeNext();

    validateIdParam(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
