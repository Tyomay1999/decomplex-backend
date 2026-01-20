import { validateCompanyUserRegister } from "../../validators/companyUserRegister.validation";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("validateCompanyUserRegister", () => {
  test("accepts valid payload, strips unknown and trims fingerprint", () => {
    const req = makeReq({
      body: {
        email: "x@x.com",
        password: "123456",
        role: "recruiter",
        position: "HR",
        language: "en",
        fingerprint: "  fp  ",
        extra: "x",
      },
    });
    const res = makeRes();
    const next = makeNext();

    validateCompanyUserRegister(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();

    expect(req.body).toEqual({
      email: "x@x.com",
      password: "123456",
      role: "recruiter",
      position: "HR",
      language: "en",
      fingerprint: "fp",
    });
  });

  test("accepts payload without optional position and fingerprint", () => {
    const req = makeReq({
      body: {
        email: "x@x.com",
        password: "123456",
        role: "admin",
        language: "hy",
      },
    });
    const res = makeRes();
    const next = makeNext();

    validateCompanyUserRegister(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();

    expect(req.body).toEqual({
      email: "x@x.com",
      password: "123456",
      role: "admin",
      language: "hy",
    });
  });

  test("calls next(error) when payload is invalid", () => {
    const req = makeReq({
      body: {
        email: "not-email",
        password: "1",
        role: "owner",
        position: "",
        language: "xx",
      },
    });
    const res = makeRes();
    const next = makeNext();

    validateCompanyUserRegister(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const err = (next as jest.Mock).mock.calls[0]?.[0] as unknown;

    expect(err).toBeInstanceOf(Error);
    expect((err as { name?: unknown }).name).toBe("DomainError");
    expect((err as { code?: unknown }).code).toBe("VALIDATION_FAILED");
    expect((err as { statusCode?: unknown }).statusCode).toBe(422);
  });
});
