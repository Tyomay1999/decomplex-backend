import type { Request } from "express";
import { logoutAction } from "../../actions/logout.action";

import * as authService from "../../../../services/authService";

type ReqWithFingerprint = Request & { fingerprint?: { hash: string } };

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

jest.mock("../../../../services/authService");

const revokeTokensMock = jest.mocked(authService.revokeTokens);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("logoutAction", () => {
  test("calls next(error) when user is not authenticated", async () => {
    const req = makeReq({
      body: { refreshToken: "rt1" },
    });
    const res = makeRes();
    const next = makeNext();

    await logoutAction(req, res, next);

    expect(revokeTokensMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test("revokes tokens when refreshToken provided and returns success", async () => {
    revokeTokensMock.mockResolvedValue();

    const req = makeReq({
      user: {
        userType: "candidate",
        id: "cand1",
        language: "en",
      },
      body: { refreshToken: "rt1" },
    });
    const res = makeRes();
    const next = makeNext();

    await logoutAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(revokeTokensMock).toHaveBeenCalledTimes(1);
    expect(revokeTokensMock).toHaveBeenCalledWith("cand1", null);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Logged out successfully",
    });
  });

  test("revokes tokens even when refreshToken is missing and returns success", async () => {
    revokeTokensMock.mockResolvedValue();

    const req = makeReq({
      user: {
        userType: "company",
        id: "u1",
        companyId: "co1",
        email: "c@c.com",
        role: "admin",
        language: "en",
      },
      body: {},
    });
    const res = makeRes();
    const next = makeNext();

    await logoutAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(revokeTokensMock).toHaveBeenCalledTimes(1);
    expect(revokeTokensMock).toHaveBeenCalledWith("u1", null);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Logged out successfully",
    });
  });

  test("passes fingerprint hash to revokeTokens when available", async () => {
    revokeTokensMock.mockResolvedValue();

    const req = makeReq({
      user: {
        userType: "candidate",
        id: "cand1",
        language: "en",
      },
      body: { refreshToken: "rt1" },
    }) as unknown as ReqWithFingerprint;

    req.fingerprint = { hash: "fh1" };

    const res = makeRes();
    const next = makeNext();

    await logoutAction(req, res, next);

    expect(revokeTokensMock).toHaveBeenCalledTimes(1);
    expect(revokeTokensMock).toHaveBeenCalledWith("cand1", "fh1");

    expect(res.json).toHaveBeenCalledTimes(1);
  });

  test("calls next(error) when revokeTokens throws", async () => {
    revokeTokensMock.mockRejectedValue(new Error("revoke fail"));

    const req = makeReq({
      user: {
        userType: "candidate",
        id: "cand1",
        language: "en",
      },
      body: { refreshToken: "rt1" },
    });
    const res = makeRes();
    const next = makeNext();

    await logoutAction(req, res, next);

    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
