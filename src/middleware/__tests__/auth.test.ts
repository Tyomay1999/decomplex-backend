import type { Request } from "express";
import { auth } from "../auth";
import * as authService from "../../services/authService";
import { makeNext, makeReq, makeRes } from "../../../tests/helpers/http";

jest.mock("../../services/authService");

const verifyAccessTokenMock = jest.mocked(authService.verifyAccessToken);

type CandidateJwt = {
  userType: "candidate";
  userId: string;
  email: string;
  role: "candidate";
  language: "en" | "ru" | "hy";
  fingerprint?: string | null;
};

type CompanyJwt = {
  userType: "company";
  userId: string;
  companyId: string;
  email: string;
  role: "admin" | "recruiter";
  language: "en" | "ru" | "hy";
  position?: string | null;
  fingerprint?: string | null;
};

function makeAuthReq(params?: { authorization?: string; fingerprintHash?: string }): Request {
  const req = makeReq() as Request;

  if (params?.authorization) {
    req.headers = { ...req.headers, authorization: params.authorization };
    req.header = ((name: string) => {
      const key = name.toLowerCase();
      const headers = req.headers as Record<string, string | undefined>;
      return headers[key];
    }) as Request["header"];
  }

  if (params?.fingerprintHash) {
    req.fingerprint = { hash: params.fingerprintHash };
  }

  return req;
}

beforeEach(() => {
  verifyAccessTokenMock.mockReset();
});

describe("auth middleware", () => {
  test("calls next(error) when authorization header is missing", () => {
    const req = makeAuthReq();
    const res = makeRes();
    const next = makeNext();

    auth(req, res, next);

    expect(verifyAccessTokenMock).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test("calls next(error) when authorization header is not a Bearer token", () => {
    const req = makeAuthReq({ authorization: "Token abc" });
    const res = makeRes();
    const next = makeNext();

    auth(req, res, next);

    expect(verifyAccessTokenMock).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test("sets candidate user when token is valid", () => {
    const candidate: CandidateJwt = {
      userType: "candidate",
      userId: "c1",
      email: "c@c.com",
      role: "candidate",
      language: "en",
      fingerprint: null,
    };

    verifyAccessTokenMock.mockReturnValue(candidate);

    const req = makeAuthReq({ authorization: "Bearer t" });
    const res = makeRes();
    const next = makeNext();

    auth(req, res, next);

    expect(verifyAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(verifyAccessTokenMock).toHaveBeenCalledWith("t");

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();

    expect(req.auth).toEqual({ userId: "c1" });
    expect(req.user).toEqual({
      userType: "candidate",
      id: "c1",
      language: "en",
    });
  });

  test("sets company user when token is valid", () => {
    const company: CompanyJwt = {
      userType: "company",
      userId: "u1",
      companyId: "co1",
      email: "c@c.com",
      role: "admin",
      language: "en",
      position: null,
      fingerprint: null,
    };

    verifyAccessTokenMock.mockReturnValue(company);

    const req = makeAuthReq({ authorization: "Bearer t" });
    const res = makeRes();
    const next = makeNext();

    auth(req, res, next);

    expect(verifyAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(verifyAccessTokenMock).toHaveBeenCalledWith("t");

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();

    expect(req.auth).toEqual({ userId: "u1" });
    expect(req.user).toEqual({
      userType: "company",
      id: "u1",
      companyId: "co1",
      email: "c@c.com",
      role: "admin",
      position: undefined,
      language: "en",
    });
  });

  test("calls next(error) when fingerprint does not match", () => {
    const candidate: CandidateJwt = {
      userType: "candidate",
      userId: "c1",
      email: "c@c.com",
      role: "candidate",
      language: "en",
      fingerprint: "fp1",
    };

    verifyAccessTokenMock.mockReturnValue(candidate);

    const req = makeAuthReq({ authorization: "Bearer t", fingerprintHash: "fp2" });
    const res = makeRes();
    const next = makeNext();

    auth(req, res, next);

    expect(verifyAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(verifyAccessTokenMock).toHaveBeenCalledWith("t");

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
