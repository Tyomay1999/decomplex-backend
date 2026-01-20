import { validateCandidateRegister } from "../../validators/candidateRegister.validation";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("validateCandidateRegister", () => {
  test("accepts valid payload, strips unknown, applies defaults and sets req.body", () => {
    const req = makeReq({
      body: {
        email: "u@u.com",
        password: "123456",
        firstName: "A",
        lastName: "B",
        language: "en",
        fingerprint: "  fp  ",
        extra: "x",
      },
    });
    const res = makeRes();
    const next = makeNext();

    validateCandidateRegister(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();

    expect(req.body).toEqual({
      email: "u@u.com",
      password: "123456",
      firstName: "A",
      lastName: "B",
      language: "en",
      fingerprint: "fp",
      rememberUser: false,
    });
  });

  test("calls next(error) when payload is invalid", () => {
    const req = makeReq({
      body: {
        email: "not-email",
        password: "1",
        firstName: "",
        lastName: "",
        language: "xx",
      },
    });
    const res = makeRes();
    const next = makeNext();

    validateCandidateRegister(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const err = (next as jest.Mock).mock.calls[0]?.[0] as unknown;

    expect(err).toBeInstanceOf(Error);
    expect((err as { name?: unknown }).name).toBe("DomainError");
    expect((err as { code?: unknown }).code).toBe("VALIDATION_FAILED");
    expect((err as { statusCode?: unknown }).statusCode).toBe(422);
  });
});
