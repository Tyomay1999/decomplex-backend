import { env } from "./env";
import type { CompanyUserRole, LocaleCode } from "../domain/types";

export type JwtCompanyUserPayload = {
  userType: "company";
  userId: string;
  companyId: string;
  email: string;
  role: CompanyUserRole;
  language: LocaleCode;
  position?: string | null;
  fingerprint?: string | null;
  jti?: string;
};

export type JwtCandidatePayload = {
  userType: "candidate";
  userId: string;
  email: string;
  role: "candidate";
  language: LocaleCode;
  fingerprint?: string | null;
  jti?: string;
};

export type JwtUserPayload = JwtCompanyUserPayload | JwtCandidatePayload;

interface JwtConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenTtlSec: number;
  refreshTokenTtlSec: number;
}

const minutes = (n: number): number => n * 60;
const days = (n: number): number => n * 24 * 60 * 60;

export const jwtConfig: JwtConfig = {
  accessTokenSecret: env.accessTokenSecret,
  refreshTokenSecret: env.refreshTokenSecret,
  accessTokenTtlSec: minutes(15),
  refreshTokenTtlSec: days(30),
};
