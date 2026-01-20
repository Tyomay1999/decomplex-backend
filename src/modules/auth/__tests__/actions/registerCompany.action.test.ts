import { registerCompanyAction } from "../../actions/registerCompany.action";

import * as companyMethods from "../../../../database/methods/companyMethods";
import * as companyUserMethods from "../../../../database/methods/companyUserMethods";
import * as authService from "../../../../services/authService";
import * as database from "../../../../database";

import bcrypt from "bcryptjs";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

jest.mock("../../../../database/methods/companyMethods");
jest.mock("../../../../database/methods/companyUserMethods");
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

const createCompanyMock = jest.mocked(companyMethods.createCompany);
const createCompanyUserMock = jest.mocked(companyUserMethods.createCompanyUser);
const issueAuthTokensMock = jest.mocked(authService.issueAuthTokens);
const getSequelizeMock = jest.mocked(database.getSequelize);

const bcryptHashMock = bcrypt.hash as unknown as jest.MockedFunction<BcryptHash>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("registerCompanyAction", () => {
  test("creates company and admin user in transaction, commits, issues tokens and returns 201", async () => {
    const trx: Trx = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };

    const sequelize: SequelizeLike = {
      transaction: jest.fn().mockResolvedValue(trx),
    };

    getSequelizeMock.mockReturnValue(sequelize as never);

    bcryptHashMock.mockResolvedValue("hash");

    createCompanyMock.mockResolvedValue({
      id: "co1",
      name: "Acme",
      email: "c@c.com",
      defaultLocale: "en",
      status: "active",
    } as never);

    createCompanyUserMock.mockResolvedValue({
      id: "u1",
      companyId: "co1",
      email: "c@c.com",
      role: "admin",
      position: "Owner",
      language: "en",
    } as never);

    issueAuthTokensMock.mockResolvedValue({ accessToken: "a", refreshToken: "r" });

    const req = makeReq({
      body: {
        name: "Acme",
        email: "c@c.com",
        password: "123456",
        defaultLocale: "en",
        adminLanguage: "en",
      },
      fingerprintHash: "fp1",
    });
    const res = makeRes();
    const next = makeNext();

    await registerCompanyAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(sequelize.transaction).toHaveBeenCalledTimes(1);

    expect(bcryptHashMock).toHaveBeenCalledTimes(1);
    expect(bcryptHashMock).toHaveBeenCalledWith("123456", 10);

    expect(createCompanyMock).toHaveBeenCalledTimes(1);
    expect(createCompanyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Acme",
        email: "c@c.com",
        passwordHash: "hash",
        defaultLocale: "en",
        status: "active",
      }),
      { transaction: trx },
    );

    expect(createCompanyUserMock).toHaveBeenCalledTimes(1);
    expect(createCompanyUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "co1",
        email: "c@c.com",
        passwordHash: "hash",
        role: "admin",
        position: "Owner",
        language: "en",
      }),
      { transaction: trx },
    );

    expect(trx.commit).toHaveBeenCalledTimes(1);
    expect(trx.rollback).toHaveBeenCalledTimes(0);

    expect(issueAuthTokensMock).toHaveBeenCalledTimes(1);
    expect(issueAuthTokensMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userType: "company",
        userId: "u1",
        companyId: "co1",
        email: "c@c.com",
        role: "admin",
        language: "en",
        position: "Owner",
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
        user: {
          id: "u1",
          email: "c@c.com",
          role: "admin",
          language: "en",
          position: "Owner",
        },
        company: {
          id: "co1",
          name: "Acme",
          email: "c@c.com",
          defaultLocale: "en",
          status: "active",
        },
      },
    });
  });

  test("uses adminLanguage fallback to defaultLocale when adminLanguage is missing", async () => {
    const trx: Trx = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };

    const sequelize: SequelizeLike = {
      transaction: jest.fn().mockResolvedValue(trx),
    };

    getSequelizeMock.mockReturnValue(sequelize as never);

    bcryptHashMock.mockResolvedValue("hash");

    createCompanyMock.mockResolvedValue({
      id: "co1",
      name: "Acme",
      email: "c@c.com",
      defaultLocale: "hy",
      status: "active",
    } as never);

    createCompanyUserMock.mockResolvedValue({
      id: "u1",
      companyId: "co1",
      email: "c@c.com",
      role: "admin",
      position: "Owner",
      language: "hy",
    } as never);

    issueAuthTokensMock.mockResolvedValue({ accessToken: "a", refreshToken: "r" });

    const req = makeReq({
      body: {
        name: "Acme",
        email: "c@c.com",
        password: "123456",
        defaultLocale: "hy",
      },
      fingerprintHash: "fp1",
    });
    const res = makeRes();
    const next = makeNext();

    await registerCompanyAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(createCompanyUserMock).toHaveBeenCalledTimes(1);
    expect(createCompanyUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "hy",
      }),
      { transaction: trx },
    );
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

    createCompanyMock.mockRejectedValue(uniqueErr);

    const req = makeReq({
      body: {
        name: "Acme",
        email: "c@c.com",
        password: "123456",
        defaultLocale: "en",
        adminLanguage: "en",
      },
      fingerprintHash: "fp1",
    });
    const res = makeRes();
    const next = makeNext();

    await registerCompanyAction(req, res, next);

    expect(trx.rollback).toHaveBeenCalledTimes(1);
    expect(trx.commit).toHaveBeenCalledTimes(0);

    expect(issueAuthTokensMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);

    const err = (next as jest.Mock).mock.calls[0]?.[0] as unknown;

    expect(err).toBeInstanceOf(Error);
    expect((err as { name?: unknown }).name).toBe("DomainError");
    expect((err as { code?: unknown }).code).toBe("COMPANY_EMAIL_CONFLICT");
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

    createCompanyMock.mockRejectedValue(new Error("db fail"));

    const req = makeReq({
      body: {
        name: "Acme",
        email: "c@c.com",
        password: "123456",
        defaultLocale: "en",
        adminLanguage: "en",
      },
    });
    const res = makeRes();
    const next = makeNext();

    await registerCompanyAction(req, res, next);

    expect(trx.rollback).toHaveBeenCalledTimes(1);
    expect(trx.commit).toHaveBeenCalledTimes(0);

    expect(issueAuthTokensMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
