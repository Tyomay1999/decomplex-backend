import { refreshTokenAction } from "../../actions/refreshToken.action";

import * as authService from "../../../../services/authService";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

jest.mock("../../../../services/authService");

const rotateRefreshTokenMock = jest.mocked(authService.rotateRefreshToken);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("refreshTokenAction", () => {
  test("calls rotateRefreshToken with body refreshToken and fingerprint hash and returns tokens", async () => {
    rotateRefreshTokenMock.mockResolvedValue({ accessToken: "a", refreshToken: "r" });

    const req = makeReq({
      body: { refreshToken: "rt1" },
      fingerprintHash: "fp1",
    });
    const res = makeRes();
    const next = makeNext();

    await refreshTokenAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(rotateRefreshTokenMock).toHaveBeenCalledTimes(1);
    expect(rotateRefreshTokenMock).toHaveBeenCalledWith("rt1", "fp1");

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { accessToken: "a", refreshToken: "r" },
    });
  });

  test("passes null fingerprint when req.fingerprint is missing", async () => {
    rotateRefreshTokenMock.mockResolvedValue({ accessToken: "a" });

    const req = makeReq({
      body: { refreshToken: "rt1" },
    });
    const res = makeRes();
    const next = makeNext();

    await refreshTokenAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(rotateRefreshTokenMock).toHaveBeenCalledTimes(1);
    expect(rotateRefreshTokenMock).toHaveBeenCalledWith("rt1", null);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { accessToken: "a" },
    });
  });

  test("calls next(error) when body is invalid", async () => {
    const req = makeReq({
      body: {},
      fingerprintHash: "fp1",
    });
    const res = makeRes();
    const next = makeNext();

    await refreshTokenAction(req, res, next);

    expect(rotateRefreshTokenMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test("calls next(error) when rotateRefreshToken throws", async () => {
    rotateRefreshTokenMock.mockRejectedValue(new Error("fail"));

    const req = makeReq({
      body: { refreshToken: "rt1" },
      fingerprintHash: "fp1",
    });
    const res = makeRes();
    const next = makeNext();

    await refreshTokenAction(req, res, next);

    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
