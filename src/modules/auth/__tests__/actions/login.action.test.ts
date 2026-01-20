import type { Request } from "express";
import { loginAction } from "../../actions/login.action";

import * as authService from "../../../../services/authService";
import * as companyUserMethods from "../../../../database/methods/companyUserMethods";
import * as candidateMethods from "../../../../database/methods/candidateMethods";

import * as bcrypt from "bcryptjs";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

jest.mock("../../../../services/authService");
jest.mock("../../../../database/methods/companyUserMethods");
jest.mock("../../../../database/methods/candidateMethods");
jest.mock("../../../../lib/logger", () => ({ httpLogger: { info: jest.fn() } }));
jest.mock("bcryptjs");

type LoginBody = {
  email: string;
  password: string;
  fingerprint?: string;
  rememberUser?: boolean;
};

type CompanyAssoc = {
  id: string;
  name: string;
  defaultLocale: string;
  status: string;
};

type CompanyUserWithCompany = companyUserMethods.CompanyUserInstance & {
  company: CompanyAssoc;
};

type BcryptCompare = (plain: string, hash: string) => Promise<boolean>;

const issueAuthTokensMock = jest.mocked(authService.issueAuthTokens);
const findCompanyUsersByEmailMock = jest.mocked(companyUserMethods.findCompanyUsersByEmail);
const getCandidateAuthByEmailMock = jest.mocked(candidateMethods.getCandidateAuthByEmail);
const bcryptCompareMock = bcrypt.compare as unknown as jest.MockedFunction<BcryptCompare>;

function makeLoginReq(params: { body: LoginBody; fingerprintHash?: string }): Request {
  const req = makeReq() as Request;
  req.body = params.body;

  if (params.fingerprintHash) {
    req.fingerprint = { hash: params.fingerprintHash };
  }

  return req;
}

beforeEach(() => {
  issueAuthTokensMock.mockReset();
  findCompanyUsersByEmailMock.mockReset();
  getCandidateAuthByEmailMock.mockReset();
  bcryptCompareMock.mockReset();
});

describe("loginAction", () => {
  test("logs in a company user and returns tokens", async () => {
    bcryptCompareMock.mockResolvedValue(true);
    issueAuthTokensMock.mockResolvedValue({ accessToken: "a", refreshToken: "r" });

    const companyUser: CompanyUserWithCompany = {
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
    } as CompanyUserWithCompany;

    findCompanyUsersByEmailMock.mockResolvedValue([companyUser]);

    const req = makeLoginReq({
      body: { email: "c@c.com", password: "123456", rememberUser: true },
      fingerprintHash: "fp-hash",
    });
    const res = makeRes();
    const next = makeNext();

    await loginAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(findCompanyUsersByEmailMock).toHaveBeenCalledTimes(1);
    expect(findCompanyUsersByEmailMock).toHaveBeenCalledWith("c@c.com", { include: ["company"] });

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

  test("logs in a candidate and returns tokens", async () => {
    bcryptCompareMock.mockResolvedValue(true);
    issueAuthTokensMock.mockResolvedValue({ accessToken: "a" });

    findCompanyUsersByEmailMock.mockResolvedValue([]);

    getCandidateAuthByEmailMock.mockResolvedValue({
      id: "cand1",
      email: "u@u.com",
      passwordHash: "hash",
      firstName: "A",
      lastName: "B",
      language: "en",
    });

    const req = makeLoginReq({
      body: { email: "u@u.com", password: "123456", rememberUser: false },
      fingerprintHash: "fp2",
    });
    const res = makeRes();
    const next = makeNext();

    await loginAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(findCompanyUsersByEmailMock).toHaveBeenCalledTimes(1);
    expect(findCompanyUsersByEmailMock).toHaveBeenCalledWith("u@u.com", { include: ["company"] });

    expect(getCandidateAuthByEmailMock).toHaveBeenCalledTimes(1);
    expect(getCandidateAuthByEmailMock).toHaveBeenCalledWith("u@u.com");

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

  test("calls next(error) when candidate is not found", async () => {
    findCompanyUsersByEmailMock.mockResolvedValue([]);
    getCandidateAuthByEmailMock.mockResolvedValue(null);

    const req = makeLoginReq({
      body: { email: "x@x.com", password: "123456", rememberUser: true },
    });
    const res = makeRes();
    const next = makeNext();

    await loginAction(req, res, next);

    expect(issueAuthTokensMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
