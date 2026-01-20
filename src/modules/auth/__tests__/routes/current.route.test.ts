import type { Request } from "express";
import { Router } from "express";

import * as authService from "../../../../services/authService";

import { authRouter } from "../../auth.routes";
import { fingerprintMiddleware } from "../../../../middleware/fingerprint";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";
import {
  handle,
  expectNextHasError,
  expectNextNoError,
} from "../../../../../tests/helpers/routerHandle";

jest.mock("../../../../services/authService");

const verifyAccessTokenMock = jest.mocked(authService.verifyAccessToken);

function makeApiRouter(): Router {
  const router = Router();
  router.use(fingerprintMiddleware);
  router.use("/auth", authRouter);
  return router;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /auth/current (router-level)", () => {
  test("returns req.user for candidate", async () => {
    verifyAccessTokenMock.mockReturnValue({
      userType: "candidate",
      userId: "u1",
      email: "u@u.com",
      role: "candidate",
      language: "en",
      fingerprint: null,
    });

    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        authorization: "Bearer access",
        "x-client-fingerprint": "fp",
      },
    }) as Request;

    req.method = "GET";
    req.url = "/auth/current";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expectNextNoError(next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        user: expect.objectContaining({
          userType: "candidate",
          id: "u1",
          language: "en",
        }),
      },
    });
  });

  test("calls next(error) when Authorization missing", async () => {
    const router = makeApiRouter();

    const req = makeReq() as Request;
    req.method = "GET";
    req.url = "/auth/current";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expectNextHasError(next);
    expect(res.json).toHaveBeenCalledTimes(0);
  });
});
