import jwt from "jsonwebtoken";
import type { JwtPayload, Secret } from "jsonwebtoken";

import * as refreshTokens from "../../messaging/redis/refreshTokens";
import {
  issueAuthTokens,
  rotateRefreshToken,
  revokeTokens,
  verifyAccessToken,
} from "../authService";

jest.mock("jsonwebtoken");
jest.mock("../../messaging/redis/refreshTokens");

type JwtSign = (payload: object, secret: Secret, options: { expiresIn: number }) => string;
type JwtVerify = (token: string, secret: Secret) => JwtPayload | string;

const jwtSignMock = jwt.sign as unknown as jest.MockedFunction<JwtSign>;
const jwtVerifyMock = jwt.verify as unknown as jest.MockedFunction<JwtVerify>;

const saveRefreshTokenMock = jest.mocked(refreshTokens.saveRefreshToken);
const loadRefreshTokenMock = jest.mocked(refreshTokens.loadRefreshToken);
const deleteRefreshTokenMock = jest.mocked(refreshTokens.deleteRefreshToken);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("issueAuthTokens", () => {
  test("returns only accessToken when rememberUser is false", async () => {
    jwtSignMock.mockReturnValueOnce("access-token");

    const payload = {
      userType: "candidate" as const,
      userId: "u1",
      email: "u@u.com",
      role: "candidate" as const,
      language: "en" as const,
      fingerprint: "fp",
    };

    const tokens = await issueAuthTokens(payload, false);

    expect(tokens).toEqual({ accessToken: "access-token" });

    expect(jwtSignMock).toHaveBeenCalledTimes(1);
    expect(saveRefreshTokenMock).toHaveBeenCalledTimes(0);
  });

  test("returns accessToken and refreshToken and saves refresh token when rememberUser is true", async () => {
    jwtSignMock.mockReturnValueOnce("access-token").mockReturnValueOnce("refresh-token");

    const payload = {
      userType: "company" as const,
      userId: "u1",
      companyId: "c1",
      email: "c@c.com",
      role: "admin" as const,
      language: "en" as const,
      position: null as string | null,
      fingerprint: "fp",
    };

    const tokens = await issueAuthTokens(payload, true);

    expect(tokens).toEqual({ accessToken: "access-token", refreshToken: "refresh-token" });

    expect(jwtSignMock).toHaveBeenCalledTimes(2);
    expect(saveRefreshTokenMock).toHaveBeenCalledTimes(1);
    expect(saveRefreshTokenMock).toHaveBeenCalledWith(
      "u1",
      "fp",
      "refresh-token",
      expect.any(Number),
    );
  });

  test("saves refresh token with fingerprint null when payload fingerprint is null", async () => {
    jwtSignMock.mockReturnValueOnce("access-token").mockReturnValueOnce("refresh-token");

    const payload = {
      userType: "candidate" as const,
      userId: "u1",
      email: "u@u.com",
      role: "candidate" as const,
      language: "en" as const,
      fingerprint: null as string | null,
    };

    await issueAuthTokens(payload, true);

    expect(saveRefreshTokenMock).toHaveBeenCalledTimes(1);
    expect(saveRefreshTokenMock).toHaveBeenCalledWith(
      "u1",
      null,
      "refresh-token",
      expect.any(Number),
    );
  });
});

describe("verifyAccessToken", () => {
  test("throws when jwt.verify throws", () => {
    jwtVerifyMock.mockImplementation(() => {
      throw new Error("bad token");
    });

    expect(() => verifyAccessToken("x")).toThrow(/invalid or expired access token/i);
  });

  test("throws when decoded payload is malformed", () => {
    jwtVerifyMock.mockReturnValueOnce("string");

    expect(() => verifyAccessToken("x")).toThrow(/malformed token payload/i);
  });

  test("returns candidate payload when valid", () => {
    jwtVerifyMock.mockReturnValueOnce({
      userType: "candidate",
      userId: "u1",
      email: "u@u.com",
      role: "candidate",
      language: "en",
      fingerprint: "fp",
    } satisfies JwtPayload);

    const payload = verifyAccessToken("access");

    expect(payload).toEqual(
      expect.objectContaining({
        userType: "candidate",
        userId: "u1",
        email: "u@u.com",
        role: "candidate",
        language: "en",
        fingerprint: "fp",
      }),
    );
  });

  test("throws when candidate email is missing", () => {
    jwtVerifyMock.mockReturnValueOnce({
      userType: "candidate",
      userId: "u1",
      language: "en",
    } satisfies JwtPayload);

    expect(() => verifyAccessToken("access")).toThrow(/email missing/i);
  });

  test("returns company payload when valid", () => {
    jwtVerifyMock.mockReturnValueOnce({
      userType: "company",
      userId: "u1",
      companyId: "c1",
      email: "c@c.com",
      role: "admin",
      language: "en",
      position: null,
      fingerprint: "fp",
    } satisfies JwtPayload);

    const payload = verifyAccessToken("access");

    expect(payload).toEqual(
      expect.objectContaining({
        userType: "company",
        userId: "u1",
        companyId: "c1",
        email: "c@c.com",
        role: "admin",
        language: "en",
        position: null,
        fingerprint: "fp",
      }),
    );
  });

  test("throws when company role is invalid", () => {
    jwtVerifyMock.mockReturnValueOnce({
      userType: "company",
      userId: "u1",
      companyId: "c1",
      email: "c@c.com",
      role: "owner",
      language: "en",
    } satisfies JwtPayload);

    expect(() => verifyAccessToken("access")).toThrow(/role invalid/i);
  });

  test("throws when userType is unknown", () => {
    jwtVerifyMock.mockReturnValueOnce({
      userType: "x",
      userId: "u1",
    } as unknown as JwtPayload);

    expect(() => verifyAccessToken("access")).toThrow(/malformed token payload/i);
  });
});

describe("rotateRefreshToken", () => {
  test("throws when jwt.verify throws", async () => {
    jwtVerifyMock.mockImplementation(() => {
      throw new Error("bad refresh");
    });

    await expect(rotateRefreshToken("r1", "fp")).rejects.toThrow(
      /invalid or expired refresh token/i,
    );
  });

  test("throws when decoded refresh token payload is malformed", async () => {
    jwtVerifyMock.mockReturnValueOnce("x");

    await expect(rotateRefreshToken("r1", "fp")).rejects.toThrow(
      /malformed refresh token payload/i,
    );
  });

  test("throws when stored refresh token is missing", async () => {
    jwtVerifyMock.mockReturnValueOnce({
      userType: "candidate",
      userId: "u1",
      email: "u@u.com",
      role: "candidate",
      language: "en",
    } satisfies JwtPayload);

    loadRefreshTokenMock.mockResolvedValueOnce(null);

    await expect(rotateRefreshToken("old-refresh", "fp")).rejects.toThrow(/no longer valid/i);

    expect(loadRefreshTokenMock).toHaveBeenCalledTimes(1);
    expect(loadRefreshTokenMock).toHaveBeenCalledWith("u1", "fp");
  });

  test("throws when stored refresh token mismatches provided refresh token", async () => {
    jwtVerifyMock.mockReturnValueOnce({
      userType: "candidate",
      userId: "u1",
      email: "u@u.com",
      role: "candidate",
      language: "en",
    } satisfies JwtPayload);

    loadRefreshTokenMock.mockResolvedValueOnce("different-refresh");

    await expect(rotateRefreshToken("old-refresh", "fp")).rejects.toThrow(/no longer valid/i);

    expect(loadRefreshTokenMock).toHaveBeenCalledTimes(1);
    expect(loadRefreshTokenMock).toHaveBeenCalledWith("u1", "fp");
  });

  test("rotates candidate refresh token and returns new tokens", async () => {
    jwtVerifyMock.mockReturnValueOnce({
      userType: "candidate",
      userId: "u1",
      email: "u@u.com",
      role: "candidate",
      language: "en",
    } satisfies JwtPayload);

    loadRefreshTokenMock.mockResolvedValueOnce("old-refresh");

    jwtSignMock.mockReturnValueOnce("new-access").mockReturnValueOnce("new-refresh");

    const tokens = await rotateRefreshToken("old-refresh", "fp");

    expect(tokens).toEqual({ accessToken: "new-access", refreshToken: "new-refresh" });

    expect(loadRefreshTokenMock).toHaveBeenCalledTimes(1);
    expect(loadRefreshTokenMock).toHaveBeenCalledWith("u1", "fp");

    expect(saveRefreshTokenMock).toHaveBeenCalledTimes(1);
    expect(saveRefreshTokenMock).toHaveBeenCalledWith(
      "u1",
      "fp",
      "new-refresh",
      expect.any(Number),
    );
  });

  test("rotates company refresh token and returns new tokens", async () => {
    jwtVerifyMock.mockReturnValueOnce({
      userType: "company",
      userId: "u1",
      companyId: "c1",
      email: "c@c.com",
      role: "admin",
      language: "en",
      position: null,
    } satisfies JwtPayload);

    loadRefreshTokenMock.mockResolvedValueOnce("old-refresh");

    jwtSignMock.mockReturnValueOnce("new-access").mockReturnValueOnce("new-refresh");

    const tokens = await rotateRefreshToken("old-refresh", "fp");

    expect(tokens).toEqual({ accessToken: "new-access", refreshToken: "new-refresh" });

    expect(loadRefreshTokenMock).toHaveBeenCalledTimes(1);
    expect(loadRefreshTokenMock).toHaveBeenCalledWith("u1", "fp");

    expect(saveRefreshTokenMock).toHaveBeenCalledTimes(1);
    expect(saveRefreshTokenMock).toHaveBeenCalledWith(
      "u1",
      "fp",
      "new-refresh",
      expect.any(Number),
    );
  });

  test("sanitizes company position when it is not null or string", async () => {
    jwtVerifyMock.mockReturnValueOnce({
      userType: "company",
      userId: "u1",
      companyId: "c1",
      email: "c@c.com",
      role: "admin",
      language: "en",
      position: { bad: true },
    } as unknown as JwtPayload);

    loadRefreshTokenMock.mockResolvedValueOnce("old-refresh");

    jwtSignMock.mockReturnValueOnce("new-access").mockReturnValueOnce("new-refresh");

    await rotateRefreshToken("old-refresh", "fp");

    const firstCall = jwtSignMock.mock.calls[0];
    const payload = firstCall?.[0] as Record<string, unknown>;

    expect(payload.position).toBeUndefined();
  });
});

describe("revokeTokens", () => {
  test("deletes refresh token by userId and fingerprint", async () => {
    await revokeTokens("u1", "fp");

    expect(deleteRefreshTokenMock).toHaveBeenCalledTimes(1);
    expect(deleteRefreshTokenMock).toHaveBeenCalledWith("u1", "fp");
  });
});
