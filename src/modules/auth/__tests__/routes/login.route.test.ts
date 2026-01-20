import type { NextFunction, Request, Response, RequestHandler } from "express";
import { Router } from "express";

import bcrypt from "bcryptjs";
import * as authService from "../../../../services/authService";
import * as companyUserMethods from "../../../../database/methods/companyUserMethods";
import * as candidateMethods from "../../../../database/methods/candidateMethods";

import { authRouter } from "../../auth.routes";
import { fingerprintMiddleware } from "../../../../middleware/fingerprint";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

jest.mock("bcryptjs");
jest.mock("../../../../services/authService");
jest.mock("../../../../database/methods/companyUserMethods");
jest.mock("../../../../database/methods/candidateMethods");

type BcryptCompare = (plain: string, hash: string) => Promise<boolean>;

const bcryptCompareMock = bcrypt.compare as unknown as jest.MockedFunction<BcryptCompare>;

const issueAuthTokensMock = jest.mocked(authService.issueAuthTokens);
const findCompanyUsersByEmailMock = jest.mocked(companyUserMethods.findCompanyUsersByEmail);
const getCandidateAuthByEmailMock = jest.mocked(candidateMethods.getCandidateAuthByEmail);

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

describe("POST /auth/login (router-level)", () => {
  test("returns 200 and tokens for company user", async () => {
    bcryptCompareMock.mockResolvedValue(true);

    findCompanyUsersByEmailMock.mockResolvedValue([
      {
        id: "u1",
        email: "c@c.com",
        passwordHash: "hash",
        role: "admin",
        language: "en",
        position: null,
        company: {
          id: "co1",
          name: "Acme",
          defaultLocale: "en",
          status: "active",
        },
      },
    ] as never);

    issueAuthTokensMock.mockResolvedValue({
      accessToken: "a",
      refreshToken: "r",
    });

    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-client-fingerprint": "fp-hash",
      },
      body: {
        email: "c@c.com",
        password: "123456",
        rememberUser: true,
      },
    }) as Request;

    req.method = "POST";
    req.url = "/auth/login";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(findCompanyUsersByEmailMock).toHaveBeenCalledTimes(1);
    expect(getCandidateAuthByEmailMock).toHaveBeenCalledTimes(0);

    expect(bcryptCompareMock).toHaveBeenCalledTimes(1);

    expect(issueAuthTokensMock).toHaveBeenCalledTimes(1);
    expect(issueAuthTokensMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userType: "company",
        userId: "u1",
        companyId: "co1",
        email: "c@c.com",
        role: "admin",
        language: "en",
        fingerprint: "fp-hash",
      }),
      true,
    );

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          accessToken: "a",
          refreshToken: "r",
          userType: "company",
        }),
      }),
    );
  });

  test("returns 200 and tokens for candidate", async () => {
    bcryptCompareMock.mockResolvedValue(true);

    findCompanyUsersByEmailMock.mockResolvedValue([]);

    getCandidateAuthByEmailMock.mockResolvedValue({
      id: "cand1",
      email: "u@u.com",
      passwordHash: "hash",
      firstName: "A",
      lastName: "B",
      language: "en",
    });

    issueAuthTokensMock.mockResolvedValue({
      accessToken: "a",
    });

    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-client-fingerprint": "fp2",
      },
      body: {
        email: "u@u.com",
        password: "123456",
        rememberUser: false,
      },
    }) as Request;

    req.method = "POST";
    req.url = "/auth/login";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(findCompanyUsersByEmailMock).toHaveBeenCalledTimes(1);
    expect(getCandidateAuthByEmailMock).toHaveBeenCalledTimes(1);

    expect(bcryptCompareMock).toHaveBeenCalledTimes(1);

    expect(issueAuthTokensMock).toHaveBeenCalledTimes(1);
    expect(issueAuthTokensMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userType: "candidate",
        userId: "cand1",
        email: "u@u.com",
        role: "candidate",
        language: "en",
        fingerprint: "fp2",
      }),
      false,
    );

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          accessToken: "a",
          userType: "candidate",
        }),
      }),
    );
  });

  test("calls next(error) when payload invalid and does not call action deps", async () => {
    const router = makeApiRouter();

    const req = makeReq({
      body: {
        email: "not-email",
        password: "1",
      },
    }) as Request;

    req.method = "POST";
    req.url = "/auth/login";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(findCompanyUsersByEmailMock).toHaveBeenCalledTimes(0);
    expect(getCandidateAuthByEmailMock).toHaveBeenCalledTimes(0);
    expect(bcryptCompareMock).toHaveBeenCalledTimes(0);
    expect(issueAuthTokensMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });
});
