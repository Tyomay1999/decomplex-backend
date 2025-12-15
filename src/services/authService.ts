import jwt, { JwtPayload } from "jsonwebtoken";
import { jwtConfig, JwtUserPayload } from "../config/jwt";
import {
  saveRefreshToken,
  loadRefreshToken,
  deleteRefreshToken,
} from "../messaging/redis/refreshTokens";
import { unauthorized } from "../errors/DomainError";
import type { CompanyUserRole, LocaleCode } from "../domain/types";

export type tokensT = { accessToken: string; refreshToken?: string };

function isJwtObject(value: JwtPayload | string): value is JwtPayload {
  return typeof value === "object" && value !== null;
}

function isUserType(v: unknown): v is JwtUserPayload["userType"] {
  return v === "company" || v === "candidate";
}

function isString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function hasUserId(value: JwtPayload): value is JwtPayload & { userId: string } {
  return isString((value as { userId?: unknown }).userId);
}

function hasUserType(
  value: JwtPayload,
): value is JwtPayload & { userType: JwtUserPayload["userType"] } {
  return isUserType((value as { userType?: unknown }).userType);
}

function isLocaleCode(v: unknown): v is LocaleCode {
  return isString(v);
}

function isCompanyUserRole(v: unknown): v is CompanyUserRole {
  return v === "admin" || v === "recruiter";
}

function assertCandidateFields(value: JwtPayload): asserts value is JwtPayload & {
  email: string;
  language: LocaleCode;
} {
  const email = (value as { email?: unknown }).email;
  const language = (value as { language?: unknown }).language;

  if (!isString(email)) {
    throw unauthorized({
      code: "INVALID_ACCESS_TOKEN",
      message: "Malformed candidate token payload (email missing)",
    });
  }

  if (!isLocaleCode(language)) {
    throw unauthorized({
      code: "INVALID_ACCESS_TOKEN",
      message: "Malformed candidate token payload (language invalid)",
    });
  }
}

function assertCompanyFields(value: JwtPayload): asserts value is JwtPayload & {
  companyId: string;
  email: string;
  role: CompanyUserRole;
  language: LocaleCode;
} {
  const companyId = (value as { companyId?: unknown }).companyId;
  const email = (value as { email?: unknown }).email;
  const role = (value as { role?: unknown }).role;
  const language = (value as { language?: unknown }).language;

  if (!isString(companyId)) {
    throw unauthorized({
      code: "INVALID_ACCESS_TOKEN",
      message: "Malformed company token payload (companyId missing)",
    });
  }

  if (!isString(email)) {
    throw unauthorized({
      code: "INVALID_ACCESS_TOKEN",
      message: "Malformed company token payload (email missing)",
    });
  }

  if (!isCompanyUserRole(role)) {
    throw unauthorized({
      code: "INVALID_ACCESS_TOKEN",
      message: "Malformed company token payload (role invalid)",
    });
  }

  if (!isLocaleCode(language)) {
    throw unauthorized({
      code: "INVALID_ACCESS_TOKEN",
      message: "Malformed company token payload (language invalid)",
    });
  }
}

export async function issueAuthTokens(
  payload: JwtUserPayload,
  rememberUser?: boolean,
): Promise<tokensT> {
  const accessToken = jwt.sign(payload, jwtConfig.accessTokenSecret, {
    expiresIn: jwtConfig.accessTokenTtlSec,
  });

  if (rememberUser === false) {
    return { accessToken };
  }

  const refreshToken = jwt.sign(payload, jwtConfig.refreshTokenSecret, {
    expiresIn: jwtConfig.refreshTokenTtlSec,
  });

  await saveRefreshToken(
    payload.userId,
    payload.fingerprint ?? null,
    refreshToken,
    jwtConfig.refreshTokenTtlSec,
  );

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): JwtUserPayload {
  let decoded: JwtPayload | string;

  try {
    decoded = jwt.verify(token, jwtConfig.accessTokenSecret);
  } catch {
    throw unauthorized({
      code: "INVALID_ACCESS_TOKEN",
      message: "Invalid or expired access token",
    });
  }

  if (!isJwtObject(decoded) || !hasUserId(decoded) || !hasUserType(decoded)) {
    throw unauthorized({
      code: "INVALID_ACCESS_TOKEN",
      message: "Malformed token payload",
    });
  }

  if (decoded.userType === "candidate") {
    assertCandidateFields(decoded);
    return decoded as JwtUserPayload;
  }

  assertCompanyFields(decoded);
  return decoded as JwtUserPayload;
}

export async function rotateRefreshToken(
  refreshToken: string,
  fingerprint: string | null,
): Promise<tokensT> {
  let decoded: JwtPayload | string;

  try {
    decoded = jwt.verify(refreshToken, jwtConfig.refreshTokenSecret);
  } catch {
    throw unauthorized({
      code: "INVALID_REFRESH_TOKEN",
      message: "Invalid or expired refresh token",
    });
  }

  if (!isJwtObject(decoded) || !hasUserId(decoded) || !hasUserType(decoded)) {
    throw unauthorized({
      code: "INVALID_REFRESH_TOKEN",
      message: "Malformed refresh token payload",
    });
  }

  const userId = decoded.userId;
  const stored = await loadRefreshToken(userId, fingerprint);

  if (!stored || stored !== refreshToken) {
    throw unauthorized({
      code: "REFRESH_TOKEN_REVOKED",
      message: "Refresh token no longer valid",
    });
  }

  if (decoded.userType === "candidate") {
    assertCandidateFields(decoded);

    const newPayload: JwtUserPayload = {
      userType: "candidate",
      userId,
      email: (decoded as { email: string }).email,
      role: "candidate",
      language: (decoded as { language: LocaleCode }).language,
      fingerprint,
    };

    return issueAuthTokens(newPayload, true);
  }

  assertCompanyFields(decoded);

  const positionRaw = (decoded as { position?: unknown }).position;
  const position =
    positionRaw === null || typeof positionRaw === "string" ? positionRaw : undefined;

  const newPayload: JwtUserPayload = {
    userType: "company",
    userId,
    companyId: (decoded as { companyId: string }).companyId,
    email: (decoded as { email: string }).email,
    role: (decoded as { role: CompanyUserRole }).role,
    language: (decoded as { language: LocaleCode }).language,
    position,
    fingerprint,
  };

  return issueAuthTokens(newPayload, true);
}

export async function revokeTokens(userId: string, fingerprint: string | null): Promise<void> {
  await deleteRefreshToken(userId, fingerprint);
}
