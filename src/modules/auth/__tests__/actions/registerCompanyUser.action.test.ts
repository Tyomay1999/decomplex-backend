import { registerCompanyUserAction } from "../../actions/registerCompanyUser.action";

import * as companyUserMethods from "../../../../database/methods/companyUserMethods";

import bcrypt from "bcryptjs";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

jest.mock("../../../../database/methods/companyUserMethods");
jest.mock("bcryptjs");

type BcryptHash = (plain: string, rounds: number) => Promise<string>;

const createCompanyUserMock = jest.mocked(companyUserMethods.createCompanyUser);

const bcryptHashMock = bcrypt.hash as unknown as jest.MockedFunction<BcryptHash>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("registerCompanyUserAction", () => {
  test("calls next(error) when authenticated company user required", async () => {
    const req = makeReq({
      user: {
        userType: "candidate",
        id: "cand1",
        language: "en",
      },
      body: {
        email: "x@x.com",
        password: "123456",
        role: "recruiter",
        language: "en",
      },
    });
    const res = makeRes();
    const next = makeNext();

    await registerCompanyUserAction(req, res, next);

    expect(createCompanyUserMock).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);

    const err = (next as jest.Mock).mock.calls[0]?.[0] as unknown;

    expect(err).toBeInstanceOf(Error);
    expect((err as { name?: unknown }).name).toBe("DomainError");
    expect((err as { code?: unknown }).code).toBe("COMPANY_REQUIRED");
    expect((err as { statusCode?: unknown }).statusCode).toBe(401);
  });

  test("creates company user and returns 201", async () => {
    bcryptHashMock.mockResolvedValue("hash");

    createCompanyUserMock.mockResolvedValue({
      id: "u2",
      companyId: "co1",
      email: "x@x.com",
      role: "recruiter",
      position: null,
      language: "en",
    } as never);

    const req = makeReq({
      user: {
        userType: "company",
        id: "u1",
        companyId: "co1",
        email: "admin@c.com",
        role: "admin",
        language: "en",
      },
      body: {
        email: "x@x.com",
        password: "123456",
        role: "recruiter",
        position: "HR",
        language: "en",
      },
    });
    const res = makeRes();
    const next = makeNext();

    await registerCompanyUserAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(bcryptHashMock).toHaveBeenCalledTimes(1);
    expect(bcryptHashMock).toHaveBeenCalledWith("123456", 10);

    expect(createCompanyUserMock).toHaveBeenCalledTimes(1);
    expect(createCompanyUserMock).toHaveBeenCalledWith({
      companyId: "co1",
      email: "x@x.com",
      passwordHash: "hash",
      role: "recruiter",
      position: "HR",
      language: "en",
    });

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        id: "u2",
        email: "x@x.com",
        role: "recruiter",
        position: null,
        language: "en",
        companyId: "co1",
      },
    });
  });

  test("sends position null when body position is missing", async () => {
    bcryptHashMock.mockResolvedValue("hash");

    createCompanyUserMock.mockResolvedValue({
      id: "u2",
      companyId: "co1",
      email: "x@x.com",
      role: "recruiter",
      position: null,
      language: "en",
    } as never);

    const req = makeReq({
      user: {
        userType: "company",
        id: "u1",
        companyId: "co1",
        email: "admin@c.com",
        role: "admin",
        language: "en",
      },
      body: {
        email: "x@x.com",
        password: "123456",
        role: "recruiter",
        language: "en",
      },
    });
    const res = makeRes();
    const next = makeNext();

    await registerCompanyUserAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(createCompanyUserMock).toHaveBeenCalledTimes(1);
    expect(createCompanyUserMock).toHaveBeenCalledWith({
      companyId: "co1",
      email: "x@x.com",
      passwordHash: "hash",
      role: "recruiter",
      position: null,
      language: "en",
    });

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("calls next(conflict) on SequelizeUniqueConstraintError", async () => {
    bcryptHashMock.mockResolvedValue("hash");

    const uniqueErr = { name: "SequelizeUniqueConstraintError" };

    createCompanyUserMock.mockRejectedValue(uniqueErr);

    const req = makeReq({
      user: {
        userType: "company",
        id: "u1",
        companyId: "co1",
        email: "admin@c.com",
        role: "admin",
        language: "en",
      },
      body: {
        email: "x@x.com",
        password: "123456",
        role: "recruiter",
        language: "en",
      },
    });
    const res = makeRes();
    const next = makeNext();

    await registerCompanyUserAction(req, res, next);

    expect(res.status).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);

    const err = (next as jest.Mock).mock.calls[0]?.[0] as unknown;

    expect(err).toBeInstanceOf(Error);
    expect((err as { name?: unknown }).name).toBe("DomainError");
    expect((err as { code?: unknown }).code).toBe("COMPANY_USER_EMAIL_CONFLICT");
    expect((err as { statusCode?: unknown }).statusCode).toBe(409);
  });

  test("calls next(error) on unexpected error", async () => {
    bcryptHashMock.mockResolvedValue("hash");

    createCompanyUserMock.mockRejectedValue(new Error("fail"));

    const req = makeReq({
      user: {
        userType: "company",
        id: "u1",
        companyId: "co1",
        email: "admin@c.com",
        role: "admin",
        language: "en",
      },
      body: {
        email: "x@x.com",
        password: "123456",
        role: "recruiter",
        language: "en",
      },
    });
    const res = makeRes();
    const next = makeNext();

    await registerCompanyUserAction(req, res, next);

    expect(res.status).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
