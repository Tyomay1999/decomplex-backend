import type { Request } from "express";
import { Router } from "express";

import * as authService from "../../../../services/authService";
import * as candidateMethods from "../../../../database/methods/candidateMethods";
import * as companyUserMethods from "../../../../database/methods/companyUserMethods";

import { authRouter } from "../../auth.routes";
import { fingerprintMiddleware } from "../../../../middleware/fingerprint";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";
import {
  handle,
  expectNextHasError,
  expectNextNoError,
  pickNextError,
} from "../../../../../tests/helpers/routerHandle";

jest.mock("../../../../services/authService");
jest.mock("../../../../database/methods/candidateMethods");
jest.mock("../../../../database/methods/companyUserMethods");

const verifyAccessTokenMock = jest.mocked(authService.verifyAccessToken);
const getCandidateByIdMock = jest.mocked(candidateMethods.getCandidateById);
const findCompanyUserByIdOrThrowMock = jest.mocked(companyUserMethods.findCompanyUserByIdOrThrow);

function makeApiRouter(): Router {
  const router = Router();
  router.use(fingerprintMiddleware);
  router.use("/auth", authRouter);
  return router;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /auth/me (router-level)", () => {
  test("returns candidate profile", async () => {
    verifyAccessTokenMock.mockReturnValue({
      userType: "candidate",
      userId: "cand1",
      email: "a@b.com",
      role: "candidate",
      language: "en",
      fingerprint: null,
    });

    getCandidateByIdMock.mockResolvedValue({
      id: "cand1",
      email: "a@b.com",
      firstName: "A",
      lastName: "B",
      language: "en",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const router = makeApiRouter();

    const req = makeReq({
      headers: { authorization: "Bearer access" },
    }) as Request;

    req.method = "GET";
    req.url = "/auth/me";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expectNextNoError(next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          userType: "candidate",
          user: expect.objectContaining({
            id: "cand1",
            email: "a@b.com",
            role: "candidate",
            language: "en",
            firstName: "A",
            lastName: "B",
          }),
        }),
      }),
    );
  });

  test("calls next(DomainError) when candidate not found", async () => {
    verifyAccessTokenMock.mockReturnValue({
      userType: "candidate",
      userId: "cand1",
      email: "a@b.com",
      role: "candidate",
      language: "en",
      fingerprint: null,
    });

    getCandidateByIdMock.mockResolvedValue(null);

    const router = makeApiRouter();

    const req = makeReq({
      headers: { authorization: "Bearer access" },
    }) as Request;

    req.method = "GET";
    req.url = "/auth/me";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expectNextHasError(next);

    const err = pickNextError(next);

    expect(err).toEqual(
      expect.objectContaining({
        name: "DomainError",
        code: "CANDIDATE_NOT_FOUND",
        statusCode: 404,
      }),
    );

    expect(res.json).toHaveBeenCalledTimes(0);
  });

  test("returns company profile", async () => {
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

    findCompanyUserByIdOrThrowMock.mockResolvedValue({
      id: "u1",
      email: "c@c.com",
      role: "admin",
      language: "en",
      position: null,
      companyId: "co1",
      company: {
        id: "co1",
        name: "Acme",
        defaultLocale: "en",
        status: "active",
      },
    } as never);

    const router = makeApiRouter();

    const req = makeReq({
      headers: { authorization: "Bearer access" },
    }) as Request;

    req.method = "GET";
    req.url = "/auth/me";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expectNextNoError(next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          userType: "company",
          user: expect.objectContaining({
            id: "u1",
            email: "c@c.com",
            role: "admin",
            language: "en",
            companyId: "co1",
          }),
          company: expect.objectContaining({
            id: "co1",
            name: "Acme",
            defaultLocale: "en",
            status: "active",
          }),
        }),
      }),
    );
  });
});
