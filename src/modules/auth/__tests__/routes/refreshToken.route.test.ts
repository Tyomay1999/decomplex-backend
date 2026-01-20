import type { NextFunction, Request, Response, RequestHandler } from "express";
import { Router } from "express";

import * as authService from "../../../../services/authService";

import { authRouter } from "../../auth.routes";
import { fingerprintMiddleware } from "../../../../middleware/fingerprint";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

jest.mock("../../../../services/authService");

const rotateRefreshTokenMock = jest.mocked(authService.rotateRefreshToken);

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

describe("POST /auth/refresh (router-level)", () => {
  test("returns tokens when payload is valid", async () => {
    rotateRefreshTokenMock.mockResolvedValue({
      accessToken: "a",
      refreshToken: "r",
    });

    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-client-fingerprint": "fp",
      },
      body: {
        refreshToken: "old",
      },
    }) as Request;

    req.method = "POST";
    req.url = "/auth/refresh";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(rotateRefreshTokenMock).toHaveBeenCalledTimes(1);
    expect(rotateRefreshTokenMock).toHaveBeenCalledWith("old", "fp");

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        accessToken: "a",
        refreshToken: "r",
      },
    });
  });

  test("calls next(error) when payload invalid", async () => {
    const router = makeApiRouter();

    const req = makeReq({
      body: {},
    }) as Request;

    req.method = "POST";
    req.url = "/auth/refresh";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(rotateRefreshTokenMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });
});
