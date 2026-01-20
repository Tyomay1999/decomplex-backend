import type { Request } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import { validateLogin } from "../../validators/login.validation";
import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

type LoginBody = {
  email?: string;
  password?: string;
  rememberUser?: boolean;
} & Record<string, unknown>;

function makeLoginReq(body: LoginBody): Request<ParamsDictionary, unknown, LoginBody, ParsedQs> {
  const req = makeReq() as Request<ParamsDictionary, unknown, LoginBody, ParsedQs>;
  req.body = body;
  return req;
}

describe("validateLogin", () => {
  test("strips unknown fields and applies default values", () => {
    const req = makeLoginReq({
      email: "a@b.com",
      password: "123456",
      rememberUser: undefined,
      extra: "x",
    });

    const res = makeRes();
    const next = makeNext();

    validateLogin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();

    expect(req.body).toEqual({
      email: "a@b.com",
      password: "123456",
      rememberUser: false,
    });
  });

  test("calls next(error) when payload is invalid", () => {
    const req = makeLoginReq({
      email: "not-email",
      password: "123",
    });

    const res = makeRes();
    const next = makeNext();

    validateLogin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
