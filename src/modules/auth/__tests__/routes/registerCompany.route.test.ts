import type { Request } from "express";
import { Router } from "express";

import bcrypt from "bcryptjs";

import { validateCompanyUserRegister } from "../../validators/companyUserRegister.validation";
import { registerCompanyUserAction } from "../../actions/registerCompanyUser.action";
import { auth as authMiddleware } from "../../../../middleware/auth";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";
import {
  handle,
  expectNextHasError,
  expectNextNoError,
  pickNextError,
} from "../../../../../tests/helpers/routerHandle";

import * as authService from "../../../../services/authService";
import * as companyUserMethods from "../../../../database/methods/companyUserMethods";

jest.mock("bcryptjs");
jest.mock("../../../../services/authService");
jest.mock("../../../../database/methods/companyUserMethods");

type BcryptHash = (plain: string, rounds: number) => Promise<string>;
const bcryptHashMock = bcrypt.hash as unknown as jest.MockedFunction<BcryptHash>;

const verifyAccessTokenMock = jest.mocked(authService.verifyAccessToken);
const createCompanyUserMock = jest.mocked(companyUserMethods.createCompanyUser);

function makeRouter(): Router {
  const router = Router();
  router.post(
    "/register/company-user",
    authMiddleware,
    validateCompanyUserRegister,
    registerCompanyUserAction,
  );
  return router;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /auth/register/company-user (router-level)", () => {
  test("returns 201 when authorized company user and payload valid", async () => {
    verifyAccessTokenMock.mockReturnValue({
      userType: "company",
      userId: "u1",
      companyId: "co1",
      email: "c@c.com",
      role: "admin",
      language: "en",
      position: null,
      fingerprint: null,
    });

    bcryptHashMock.mockResolvedValue("hash");

    createCompanyUserMock.mockResolvedValue({
      id: "u2",
      companyId: "co1",
      email: "x@x.com",
      passwordHash: "hash",
      role: "recruiter",
      language: "en",
      position: "HR",
    } as unknown as companyUserMethods.CompanyUserInstance);

    const router = makeRouter();

    const req = makeReq({
      headers: { authorization: "Bearer token" },
      body: {
        email: "x@x.com",
        password: "123456",
        role: "recruiter",
        position: "HR",
        language: "en",
        extra: "x",
      },
    }) as Request;

    req.method = "POST";
    req.url = "/register/company-user";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expectNextNoError(next);

    expect(bcryptHashMock).toHaveBeenCalledWith("123456", 10);

    expect(createCompanyUserMock).toHaveBeenCalledTimes(1);
    expect(createCompanyUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "co1",
        email: "x@x.com",
        passwordHash: "hash",
        role: "recruiter",
        position: "HR",
        language: "en",
      }),
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledTimes(1);
  });

  test("calls next(DomainError) when authenticated user is not company", async () => {
    verifyAccessTokenMock.mockReturnValue({
      userType: "candidate",
      userId: "cand1",
      email: "u@u.com",
      role: "candidate",
      language: "en",
      fingerprint: null,
    });

    const router = makeRouter();

    const req = makeReq({
      headers: { authorization: "Bearer token" },
      body: {
        email: "x@x.com",
        password: "123456",
        role: "recruiter",
        language: "en",
      },
    }) as Request;

    req.method = "POST";
    req.url = "/register/company-user";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expectNextHasError(next);

    const err = pickNextError(next);

    expect(err).toEqual(
      expect.objectContaining({
        name: "DomainError",
        code: "COMPANY_REQUIRED",
        statusCode: 401,
      }),
    );

    expect(createCompanyUserMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });

  test("calls next(DomainError) on SequelizeUniqueConstraintError", async () => {
    verifyAccessTokenMock.mockReturnValue({
      userType: "company",
      userId: "u1",
      companyId: "co1",
      email: "c@c.com",
      role: "admin",
      language: "en",
      position: null,
      fingerprint: null,
    });

    bcryptHashMock.mockResolvedValue("hash");

    createCompanyUserMock.mockRejectedValue({
      name: "SequelizeUniqueConstraintError",
    } as unknown as Error);

    const router = makeRouter();

    const req = makeReq({
      headers: { authorization: "Bearer token" },
      body: {
        email: "x@x.com",
        password: "123456",
        role: "recruiter",
        language: "en",
      },
    }) as Request;

    req.method = "POST";
    req.url = "/register/company-user";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expectNextHasError(next);

    const err = pickNextError(next);

    expect(err).toEqual(
      expect.objectContaining({
        name: "DomainError",
        code: "COMPANY_USER_EMAIL_CONFLICT",
        statusCode: 409,
      }),
    );

    expect(res.json).toHaveBeenCalledTimes(0);
  });
});
