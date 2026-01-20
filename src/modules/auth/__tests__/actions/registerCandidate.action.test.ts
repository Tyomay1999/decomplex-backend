import { registerCandidateAction } from "../../actions/registerCandidate.action";

import * as candidateMethods from "../../../../database/methods/candidateMethods";
import * as authService from "../../../../services/authService";
import * as database from "../../../../database";

import bcrypt from "bcryptjs";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

jest.mock("../../../../database/methods/candidateMethods");
jest.mock("../../../../services/authService");
jest.mock("../../../../database");
jest.mock("bcryptjs");

type Trx = {
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
};

type SequelizeLike = {
  transaction: () => Promise<Trx>;
};

type BcryptHash = (plain: string, rounds: number) => Promise<string>;

const createCandidateMock = jest.mocked(candidateMethods.createCandidate);
const issueAuthTokensMock = jest.mocked(authService.issueAuthTokens);
const getSequelizeMock = jest.mocked(database.getSequelize);

const bcryptHashMock = bcrypt.hash as unknown as jest.MockedFunction<BcryptHash>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("registerCandidateAction", () => {
  test("creates candidate in transaction, commits, issues tokens and returns 201", async () => {
    const trx: Trx = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };

    const sequelize: SequelizeLike = {
      transaction: jest.fn().mockResolvedValue(trx),
    };

    getSequelizeMock.mockReturnValue(sequelize as never);

    bcryptHashMock.mockResolvedValue("hash");

    createCandidateMock.mockResolvedValue({
      id: "cand1",
      email: "u@u.com",
      firstName: "A",
      lastName: "B",
      language: "en",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    issueAuthTokensMock.mockResolvedValue({ accessToken: "a", refreshToken: "r" });

    const req = makeReq({
      body: {
        email: "u@u.com",
        password: "123456",
        firstName: "A",
        lastName: "B",
        language: "en",
        rememberUser: true,
      },
      fingerprintHash: "fp1",
    });
    const res = makeRes();
    const next = makeNext();

    await registerCandidateAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(sequelize.transaction).toHaveBeenCalledTimes(1);

    expect(bcryptHashMock).toHaveBeenCalledTimes(1);
    expect(bcryptHashMock).toHaveBeenCalledWith("123456", 10);

    expect(createCandidateMock).toHaveBeenCalledTimes(1);
    expect(createCandidateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "u@u.com",
        passwordHash: "hash",
        firstName: "A",
        lastName: "B",
        language: "en",
      }),
      { transaction: trx },
    );

    expect(trx.commit).toHaveBeenCalledTimes(1);
    expect(trx.rollback).toHaveBeenCalledTimes(0);

    expect(issueAuthTokensMock).toHaveBeenCalledTimes(1);
    expect(issueAuthTokensMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userType: "candidate",
        userId: "cand1",
        email: "u@u.com",
        role: "candidate",
        language: "en",
        fingerprint: "fp1",
      }),
      true,
    );

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        accessToken: "a",
        refreshToken: "r",
        fingerprintHash: "fp1",
        userType: "candidate",
        user: {
          id: "cand1",
          email: "u@u.com",
          role: "candidate",
          language: "en",
          firstName: "A",
          lastName: "B",
        },
      },
    });
  });

  test("uses env defaultLocale when body language is missing", async () => {
    const trx: Trx = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };

    const sequelize: SequelizeLike = {
      transaction: jest.fn().mockResolvedValue(trx),
    };

    getSequelizeMock.mockReturnValue(sequelize as never);

    bcryptHashMock.mockResolvedValue("hash");

    createCandidateMock.mockResolvedValue({
      id: "cand1",
      email: "u@u.com",
      firstName: "A",
      lastName: "B",
      language: "en",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    issueAuthTokensMock.mockResolvedValue({ accessToken: "a" });

    const req = makeReq({
      body: {
        email: "u@u.com",
        password: "123456",
        firstName: "A",
        lastName: "B",
        rememberUser: false,
      },
      fingerprintHash: "fp1",
    });
    const res = makeRes();
    const next = makeNext();

    await registerCandidateAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(createCandidateMock).toHaveBeenCalledTimes(1);
    expect(createCandidateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "en",
      }),
      { transaction: trx },
    );

    expect(issueAuthTokensMock).toHaveBeenCalledTimes(1);
    expect(issueAuthTokensMock).toHaveBeenCalledWith(expect.any(Object), false);
  });

  test("rolls back and calls next(conflict) on SequelizeUniqueConstraintError", async () => {
    const trx: Trx = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };

    const sequelize: SequelizeLike = {
      transaction: jest.fn().mockResolvedValue(trx),
    };

    getSequelizeMock.mockReturnValue(sequelize as never);

    bcryptHashMock.mockResolvedValue("hash");

    const uniqueErr = { name: "SequelizeUniqueConstraintError" };

    createCandidateMock.mockRejectedValue(uniqueErr);

    const req = makeReq({
      body: {
        email: "u@u.com",
        password: "123456",
        firstName: "A",
        lastName: "B",
        language: "en",
      },
      fingerprintHash: "fp1",
    });
    const res = makeRes();
    const next = makeNext();

    await registerCandidateAction(req, res, next);

    expect(trx.rollback).toHaveBeenCalledTimes(1);
    expect(trx.commit).toHaveBeenCalledTimes(0);

    expect(issueAuthTokensMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);

    const err = (next as jest.Mock).mock.calls[0]?.[0] as unknown;

    expect(err).toBeInstanceOf(Error);
    expect((err as { name?: unknown }).name).toBe("DomainError");
    expect((err as { code?: unknown }).code).toBe("CANDIDATE_EMAIL_CONFLICT");
    expect((err as { statusCode?: unknown }).statusCode).toBe(409);
  });

  test("rolls back and calls next(error) on unexpected error", async () => {
    const trx: Trx = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };

    const sequelize: SequelizeLike = {
      transaction: jest.fn().mockResolvedValue(trx),
    };

    getSequelizeMock.mockReturnValue(sequelize as never);

    bcryptHashMock.mockResolvedValue("hash");

    createCandidateMock.mockRejectedValue(new Error("db fail"));

    const req = makeReq({
      body: {
        email: "u@u.com",
        password: "123456",
        firstName: "A",
        lastName: "B",
        language: "en",
      },
    });
    const res = makeRes();
    const next = makeNext();

    await registerCandidateAction(req, res, next);

    expect(trx.rollback).toHaveBeenCalledTimes(1);
    expect(trx.commit).toHaveBeenCalledTimes(0);

    expect(issueAuthTokensMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
