import type { NextFunction, Request, Response, RequestHandler } from "express";
import { Router } from "express";

import * as authService from "../../../../services/authService";

import { authRouter } from "../../auth.routes";
import { fingerprintMiddleware } from "../../../../middleware/fingerprint";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

jest.mock("../../../../services/authService");

const verifyAccessTokenMock = jest.mocked(authService.verifyAccessToken);
const revokeTokensMock = jest.mocked(authService.revokeTokens);

function makeApiRouter(): Router {
  const router = Router();
  router.use(fingerprintMiddleware);
  router.use("/auth", authRouter);
  return router;
}

function handle(router: Router, req: Request, res: Response, next: NextFunction): Promise<void> {
  return new Promise((resolve) => {
    let done = false;

    const resolveOnce = (): void => {
      if (done) return;
      done = true;
      resolve();
    };

    const nextWrapped: NextFunction = ((err?: unknown) => {
      (next as unknown as jest.Mock)(err);
      resolveOnce();
    }) as NextFunction;

    const jsonFn = res.json as unknown as jest.Mock | undefined;
    const sendFn = res.send as unknown as jest.Mock | undefined;
    const endOriginal = res.end ? res.end.bind(res) : undefined;

    if (jsonFn) {
      const original = jsonFn;
      (res as unknown as { json: jest.Mock }).json = jest.fn((...args: unknown[]) => {
        const ret = original(...args);
        resolveOnce();
        return ret;
      });
    }

    if (sendFn) {
      const original = sendFn;
      (res as unknown as { send: jest.Mock }).send = jest.fn((...args: unknown[]) => {
        const ret = original(...args);
        resolveOnce();
        return ret;
      });
    }

    if (endOriginal) {
      res.end = ((...args: Parameters<Response["end"]>) => {
        const ret = endOriginal(...args);
        resolveOnce();
        return ret;
      }) as Response["end"];
    }

    const fn = router as unknown as RequestHandler;
    fn(req, res, nextWrapped);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PATCH /auth/logout (router-level)", () => {
  test("revokes tokens when refreshToken provided", async () => {
    verifyAccessTokenMock.mockReturnValue({
      userType: "candidate",
      userId: "u1",
      email: "u@u.com",
      role: "candidate",
      language: "en",
    });

    revokeTokensMock.mockResolvedValue();

    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        authorization: "Bearer access",
      },
      body: {
        refreshToken: "r1",
      },
    }) as Request;

    req.method = "PATCH";
    req.url = "/auth/logout";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(revokeTokensMock).toHaveBeenCalledTimes(1);
    expect(revokeTokensMock).toHaveBeenCalledWith("u1", expect.anything());

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      }),
    );
  });

  test("returns success even without refreshToken", async () => {
    verifyAccessTokenMock.mockReturnValue({
      userType: "company",
      userId: "u1",
      companyId: "co1",
      email: "c@c.com",
      role: "admin",
      language: "en",
      position: null,
    });

    revokeTokensMock.mockResolvedValue();

    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        authorization: "Bearer access",
      },
      body: {},
    }) as Request;

    req.method = "PATCH";
    req.url = "/auth/logout";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(revokeTokensMock).toHaveBeenCalledTimes(1);
    expect(revokeTokensMock).toHaveBeenCalledWith("u1", expect.anything());

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      }),
    );
  });

  test("calls next(error) when Authorization missing", async () => {
    const router = makeApiRouter();

    const req = makeReq({
      body: {},
    }) as Request;

    req.method = "PATCH";
    req.url = "/auth/logout";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(revokeTokensMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });
});
