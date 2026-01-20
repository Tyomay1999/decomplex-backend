import type { LocaleCode } from "../../src/domain/types";

type CandidateUserOverrides = Partial<Extract<Express.UserPayload, { userType: "candidate" }>>;
type CompanyUserOverrides = Partial<Extract<Express.UserPayload, { userType: "company" }>>;

export function candidateUser(
  overrides: CandidateUserOverrides = {},
): Extract<Express.UserPayload, { userType: "candidate" }> {
  const base: Extract<Express.UserPayload, { userType: "candidate" }> = {
    userType: "candidate",
    id: "cand-1",
    language: "en" as LocaleCode,
  };

  return { ...base, ...overrides };
}

export function companyUser(
  overrides: CompanyUserOverrides = {},
): Extract<Express.UserPayload, { userType: "company" }> {
  const base: Extract<Express.UserPayload, { userType: "company" }> = {
    userType: "company",
    id: "user-1",
    companyId: "company-1",
    email: "user@company.com",
    role: "admin",
    language: "en" as LocaleCode,
    position: undefined,
  };

  return { ...base, ...overrides };
}
