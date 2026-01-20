import type { NextFunction, Request, Response, RequestHandler } from "express";
import { Router } from "express";

import { validateCandidateRegister } from "../../validators/candidateRegister.validation";
import { registerCandidateAction } from "../../actions/registerCandidate.action";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

import bcrypt from "bcryptjs";
import * as authService from "../../../../services/authService";
import * as candidateMethods from "../../../../database/methods/candidateMethods";
import * as db from "../../../../database";

jest.mock("bcryptjs");
jest.mock("../../../../services/authService");
jest.mock("../../../../database/methods/candidateMethods");
jest.mock("../../../../database");

type BcryptHash = (plain: string, rounds: number) => Promise<string>;
const bcryptHashMock = bcrypt.hash as unknown as jest.MockedFunction<BcryptHash>;

const issueAuthTokensMock = jest.mocked(authService.issueAuthTokens);
const createCandidateMock = jest.mocked(candidateMethods.createCandidate);
const getSequelizeMock = jest.mocked(db.getSequelize);

type Trx = { commit: jest.Mock; rollback: jest.Mock };

function makeRouter(): Router {
  const router = Router();
  router.post("/register/candidate", validateCandidateRegister, registerCandidateAction);
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

    const jsonMock = res.json as unknown as jest.Mock | undefined;
    const sendMock = res.send as unknown as jest.Mock | undefined;
    const endFn = res.end?.bind(res);

    if (jsonMock) {
      const original = jsonMock;
      (res as unknown as { json: jest.Mock }).json = jest.fn((...args: unknown[]) => {
        const ret = original(...args);
        resolveOnce();
        return ret;
      });
    }

    if (sendMock) {
      const original = sendMock;
      (res as unknown as { send: jest.Mock }).send = jest.fn((...args: unknown[]) => {
        const ret = original(...args);
        resolveOnce();
        return ret;
      });
    }

    if (endFn) {
      res.end = ((...args: Parameters<Response["end"]>) => {
        const ret = endFn(...args);
        resolveOnce();
        return ret;
      }) as Response["end"];
    }

    const fn = router as unknown as RequestHandler;
    fn(req, res, nextWrapped);
  });
}

describe("POST /register/candidate (router-level)", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const trx: Trx = { commit: jest.fn(), rollback: jest.fn() };

    getSequelizeMock.mockReturnValue({
      transaction: jest.fn().mockResolvedValue(trx),
    } as unknown as ReturnType<typeof db.getSequelize>);
  });

  test("returns 201 and tokens when payload is valid", async () => {
    bcryptHashMock.mockResolvedValue("hashed-pass");

    createCandidateMock.mockResolvedValue({
      id: "cand1",
      email: "a@b.com",
      firstName: "A",
      lastName: "B",
      language: "en",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    issueAuthTokensMock.mockResolvedValue({
      accessToken: "access",
      refreshToken: "refresh",
    });

    const router = makeRouter();

    const req = makeReq({
      body: {
        email: "a@b.com",
        password: "123456",
        firstName: "A",
        lastName: "B",
        language: "en",
        rememberUser: true,
        fingerprint: "  fp  ",
        extra: "remove-me",
      },
      fingerprintHash: "fp-hash",
    }) as Request;

    req.method = "POST";
    req.url = "/register/candidate";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    if ((next as unknown as jest.Mock).mock.calls.length > 0) {
      expect(next).toHaveBeenCalledWith();
    }

    expect(req.body).toEqual({
      email: "a@b.com",
      password: "123456",
      firstName: "A",
      lastName: "B",
      language: "en",
      fingerprint: "fp",
      rememberUser: true,
    });

    expect(bcryptHashMock).toHaveBeenCalledWith("123456", 10);

    expect(createCandidateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "a@b.com",
        passwordHash: "hashed-pass",
        firstName: "A",
        lastName: "B",
        language: "en",
      }),
      expect.objectContaining({
        transaction: expect.any(Object),
      }),
    );

    expect(issueAuthTokensMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userType: "candidate",
        userId: "cand1",
        email: "a@b.com",
        role: "candidate",
        language: "en",
        fingerprint: "fp-hash",
      }),
      true,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          accessToken: "access",
          refreshToken: "refresh",
          fingerprintHash: "fp-hash",
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

  test("calls next(error) when payload is invalid and does not call action deps", async () => {
    const router = makeRouter();

    const req = makeReq({
      body: {
        email: "not-email",
        password: "123",
        firstName: "",
        lastName: "",
        language: "en",
      },
    }) as Request;

    req.method = "POST";
    req.url = "/register/candidate";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(bcryptHashMock).not.toHaveBeenCalled();
    expect(createCandidateMock).not.toHaveBeenCalled();
    expect(issueAuthTokensMock).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test("calls next(DomainError) on SequelizeUniqueConstraintError", async () => {
    bcryptHashMock.mockResolvedValue("hashed-pass");

    const uniqueErr = { name: "SequelizeUniqueConstraintError" };
    createCandidateMock.mockRejectedValue(uniqueErr as unknown as Error);

    const router = makeRouter();

    const req = makeReq({
      body: {
        email: "a@b.com",
        password: "123456",
        firstName: "A",
        lastName: "B",
        language: "en",
        rememberUser: true,
      },
    }) as Request;

    req.method = "POST";
    req.url = "/register/candidate";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const err = (next as unknown as jest.Mock).mock.calls[0]?.[0] as unknown;
    expect(err).toEqual(
      expect.objectContaining({
        name: "DomainError",
        code: "CANDIDATE_EMAIL_CONFLICT",
        statusCode: 409,
      }),
    );

    expect(issueAuthTokensMock).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
