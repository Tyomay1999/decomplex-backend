import { createHttpClient } from "../helpers/http";
import { e2eEnv } from "../helpers/env";
import type { ApiResponse, VacancyItem } from "../helpers/types";
import type { Paths } from "../helpers/flows";
import {
  createVacancy,
  login,
  registerCandidate,
  registerCompany,
  registerCompanyUser,
} from "../helpers/flows";

type VacancyResponse = { vacancy: VacancyItem };

const paths: Paths = {
  auth: {
    registerCandidate: "/api/auth/register/candidate",
    registerCompany: "/api/auth/register/company",
    registerCompanyUser: "/api/auth/register/company-user",
    login: "/api/auth/login",
    refresh: "/api/auth/refresh",
    me: "/api/auth/me",
    logout: "/api/auth/logout",
  },
  vacancies: {
    create: "/api/vacancies",
    list: "/api/vacancies",
    getById: (id: string) => `/api/vacancies/${id}`,
    apply: (id: string) => `/api/vacancies/${id}/apply`,
    listApplications: (id: string) => `/api/vacancies/${id}/applications`,
  },
  applications: {
    listMine: "/api/applications/my",
  },
};

const makeHeaders = (fingerprint: string): Record<string, string> => ({
  "x-client-fingerprint": fingerprint,
  "accept-language": "en",
});

const uniq = (): string => `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

const readErrorCode = (body: unknown): string | null => {
  if (!isObject(body)) return null;
  const err = body["error"];
  if (!isObject(err)) return null;
  const code = err["code"];
  return typeof code === "string" ? code : null;
};

const withBearer = (
  headers: Record<string, string>,
  accessToken: string,
): Record<string, string> => ({
  ...headers,
  authorization: `Bearer ${accessToken}`,
});

describe("E2E RBAC", () => {
  const { baseUrl, fingerprint } = e2eEnv();
  const http = createHttpClient(baseUrl);
  const headers = makeHeaders(fingerprint);

  test("Recruiter can manage vacancies, candidate cannot, cross-company access denied", async () => {
    const u = uniq();

    const ownerA = `company.owner.a.${u}@example.com`;
    const recruiterA = `company.recruiter.a.${u}@example.com`;

    const ownerB = `company.owner.b.${u}@example.com`;
    const adminB = `company.admin.b.${u}@example.com`;

    const candidateEmail = `candidate.rbac.${u}@example.com`;

    const companyA = await registerCompany(
      http,
      paths,
      { name: `E2E Company A ${u}`, email: ownerA, password: "StrongPassword123!" },
      headers,
    );

    const ownerASession = await login(
      http,
      paths,
      { email: ownerA, password: "StrongPassword123!" },
      headers,
    );

    await registerCompanyUser(
      http,
      paths,
      ownerASession,
      {
        companyId: companyA.companyId,
        firstName: "Rec",
        lastName: "A",
        email: recruiterA,
        password: "StrongPassword123!",
        role: "recruiter",
        language: "en",
      },
      headers,
    );

    const recruiterSession = await login(
      http,
      paths,
      { email: recruiterA, password: "StrongPassword123!" },
      headers,
    );

    const createdVacancy = await createVacancy(
      http,
      paths,
      recruiterSession,
      {
        title: "RBAC Vacancy",
        description: "RBAC vacancy description long enough",
        location: "Yerevan",
        jobType: "full_time",
      },
      headers,
    );

    const patchRes = await http.patch<ApiResponse<VacancyResponse>, { title: string }>(
      paths.vacancies.getById(createdVacancy.vacancyId),
      { title: "RBAC Vacancy Updated" },
      {
        cookies: recruiterSession.cookies,
        headers: withBearer(headers, recruiterSession.accessToken),
      },
    );

    expect(patchRes.status).toBe(200);

    const delRes = await http.delete<ApiResponse<VacancyResponse>>(
      paths.vacancies.getById(createdVacancy.vacancyId),
      {
        cookies: recruiterSession.cookies,
        headers: withBearer(headers, recruiterSession.accessToken),
      },
    );

    expect(delRes.status).toBe(200);

    await registerCandidate(
      http,
      paths,
      {
        firstName: "Cand",
        lastName: "RBAC",
        email: candidateEmail,
        password: "StrongPassword123!",
        language: "en",
      },
      headers,
    );

    const candidateSession = await login(
      http,
      paths,
      { email: candidateEmail, password: "StrongPassword123!" },
      headers,
    );

    const candCreate = await http.post<
      ApiResponse<Record<string, never>>,
      { title: string; description: string; jobType: string; location: string }
    >(
      paths.vacancies.create,
      {
        title: "Should Fail",
        description: "Candidate should not create vacancies",
        jobType: "full_time",
        location: "Yerevan",
      },
      {
        cookies: candidateSession.cookies,
        headers: withBearer(headers, candidateSession.accessToken),
      },
    );

    expect(candCreate.status).toBe(401);

    const companyB = await registerCompany(
      http,
      paths,
      { name: `E2E Company B ${u}`, email: ownerB, password: "StrongPassword123!" },
      headers,
    );

    const ownerBSession = await login(
      http,
      paths,
      { email: ownerB, password: "StrongPassword123!" },
      headers,
    );

    await registerCompanyUser(
      http,
      paths,
      ownerBSession,
      {
        companyId: companyB.companyId,
        firstName: "Admin",
        lastName: "B",
        email: adminB,
        password: "StrongPassword123!",
        role: "admin",
        language: "en",
      },
      headers,
    );

    const adminBSession = await login(
      http,
      paths,
      { email: adminB, password: "StrongPassword123!" },
      headers,
    );

    const vacancyB = await createVacancy(
      http,
      paths,
      adminBSession,
      {
        title: "Company B Vacancy",
        description: "Company B vacancy description long enough",
        location: "Remote",
        jobType: "full_time",
      },
      headers,
    );

    const crossDelete = await http.delete<ApiResponse<Record<string, never>>>(
      paths.vacancies.getById(vacancyB.vacancyId),
      {
        cookies: recruiterSession.cookies,
        headers: withBearer(headers, recruiterSession.accessToken),
      },
    );

    expect(crossDelete.status).toBe(401);

    const code = readErrorCode(crossDelete.body);
    expect(code === "OWNERSHIP_REQUIRED" || code === "UNAUTHORIZED").toBe(true);
  });

  test("Only admin can create company users (recruiter must be denied)", async () => {
    const u = uniq();

    const ownerEmail = `company.owner.rbac.${u}@example.com`;
    const adminEmail = `company.admin.rbac.${u}@example.com`;
    const recruiterEmail = `company.recruiter.rbac.${u}@example.com`;
    const newUserEmail = `company.new.user.rbac.${u}@example.com`;

    const company = await registerCompany(
      http,
      paths,
      { name: `E2E Company RBAC ${u}`, email: ownerEmail, password: "StrongPassword123!" },
      headers,
    );

    const ownerSession = await login(
      http,
      paths,
      { email: ownerEmail, password: "StrongPassword123!" },
      headers,
    );

    await registerCompanyUser(
      http,
      paths,
      ownerSession,
      {
        companyId: company.companyId,
        firstName: "Admin",
        lastName: "User",
        email: adminEmail,
        password: "StrongPassword123!",
        role: "admin",
        language: "en",
      },
      headers,
    );

    await registerCompanyUser(
      http,
      paths,
      ownerSession,
      {
        companyId: company.companyId,
        firstName: "Recruiter",
        lastName: "User",
        email: recruiterEmail,
        password: "StrongPassword123!",
        role: "recruiter",
        language: "en",
      },
      headers,
    );

    const recruiterSession = await login(
      http,
      paths,
      { email: recruiterEmail, password: "StrongPassword123!" },
      headers,
    );

    const denyRes = await http.post<
      ApiResponse<Record<string, never>>,
      {
        companyId: string;
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        role: "admin" | "recruiter";
        language: string;
      }
    >(
      paths.auth.registerCompanyUser,
      {
        companyId: company.companyId,
        firstName: "Denied",
        lastName: "User",
        email: newUserEmail,
        password: "StrongPassword123!",
        role: "recruiter",
        language: "en",
      },
      {
        cookies: recruiterSession.cookies,
        headers: withBearer(headers, recruiterSession.accessToken),
      },
    );

    expect(denyRes.status).toBe(403);

    const code = readErrorCode(denyRes.body);
    expect(code).toBe("FORBIDDEN");
  });
});
