import type { Request } from "express";
import type { LocaleCode } from "../../src/config/i18n";

type CandidateUser = Extract<Express.UserPayload, { userType: "candidate" }>;
type CompanyUser = Extract<Express.UserPayload, { userType: "company" }>;

export function setFingerprint(req: Request, hash: string): void {
  (req as Request).fingerprint = { hash };
}

export function setAuthHeader(
  req: { __headers: Record<string, string | undefined> },
  token: string,
): void {
  req.__headers["authorization"] = `Bearer ${token}`;
}

export function setCandidateUser(req: Request, overrides?: Partial<CandidateUser>): void {
  req.user = {
    userType: "candidate",
    id: "cand-1",
    language: "en" as LocaleCode,
    ...overrides,
  };
}

export function setCompanyUser(req: Request, overrides?: Partial<CompanyUser>): void {
  req.user = {
    userType: "company",
    id: "cu-1",
    companyId: "co-1",
    email: "c@c.com",
    role: "admin",
    language: "en" as LocaleCode,
    ...overrides,
  };
}
