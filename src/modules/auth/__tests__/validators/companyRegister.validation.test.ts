import { validateCompanyRegister } from "../../validators/companyRegister.validation";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("validateCompanyRegister", () => {
  test("accepts valid payload, strips unknown and trims fingerprint", () => {
    const req = makeReq({
      body: {
        name: "Acme",
        email: "c@c.com",
        password: "123456",
        defaultLocale: "en",
        adminLanguage: "hy",
        fingerprint: "  fp  ",
        extra: "x",
      },
    });
    const res = makeRes();
    const next = makeNext();

    validateCompanyRegister(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();

    expect(req.body).toEqual({
      name: "Acme",
      email: "c@c.com",
      password: "123456",
      defaultLocale: "en",
      adminLanguage: "hy",
      fingerprint: "fp",
    });
  });

  test("accepts minimal payload without optional fields", () => {
    const req = makeReq({
      body: {
        name: "Acme",
        email: "c@c.com",
        password: "123456",
      },
    });
    const res = makeRes();
    const next = makeNext();

    validateCompanyRegister(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();

    expect(req.body).toEqual({
      name: "Acme",
      email: "c@c.com",
      password: "123456",
    });
  });

  test("calls next(error) when payload is invalid", () => {
    const req = makeReq({
      body: {
        name: "A",
        email: "not-email",
        password: "1",
        defaultLocale: "xx",
        adminLanguage: "yy",
      },
    });
    const res = makeRes();
    const next = makeNext();

    validateCompanyRegister(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const err = (next as jest.Mock).mock.calls[0]?.[0] as unknown;

    expect(err).toBeInstanceOf(Error);
    expect((err as { name?: unknown }).name).toBe("DomainError");
    expect((err as { code?: unknown }).code).toBe("VALIDATION_FAILED");
    expect((err as { statusCode?: unknown }).statusCode).toBe(422);
  });
});
