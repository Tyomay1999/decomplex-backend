import { createHttpClient } from "../helpers/http";
import { e2eEnv } from "../helpers/env";
import type { Paths } from "../helpers/flows";
import { createVacancy, login, registerCompany, registerCompanyUser } from "../helpers/flows";
import type { ApiResponse } from "../helpers/types";

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
  const err = body.error;
  if (!isObject(err)) return null;
  return typeof err.code === "string" ? err.code : null;
};

describe("E2E Update Vacancy Ownership", () => {
  const { baseUrl, fingerprint } = e2eEnv();
  const http = createHttpClient(baseUrl);
  const headers = makeHeaders(fingerprint);

  test("Company B cannot update Company A vacancy -> 401 OWNERSHIP_REQUIRED", async () => {
    const u = uniq();

    const aOwner = `upd.a.owner.${u}@example.com`;
    const aAdmin = `upd.a.admin.${u}@example.com`;

    const bOwner = `upd.b.owner.${u}@example.com`;
    const bAdmin = `upd.b.admin.${u}@example.com`;

    const companyA = await registerCompany(
      http,
      paths,
      { name: `E2E Update A ${u}`, email: aOwner, password: "StrongPassword123!" },
      headers,
    );

    const aOwnerSession = await login(
      http,
      paths,
      { email: aOwner, password: "StrongPassword123!", rememberUser: false },
      headers,
    );

    await registerCompanyUser(
      http,
      paths,
      aOwnerSession,
      {
        companyId: companyA.companyId,
        firstName: "A",
        lastName: "Admin",
        email: aAdmin,
        password: "StrongPassword123!",
        role: "admin",
        language: "en",
      },
      headers,
    );

    const aAdminSession = await login(
      http,
      paths,
      { email: aAdmin, password: "StrongPassword123!", rememberUser: false },
      headers,
    );

    const vacancy = await createVacancy(
      http,
      paths,
      aAdminSession,
      {
        title: "Upd Vacancy",
        description: "Update ownership test vacancy description",
        location: "Yerevan",
        jobType: "hybrid",
      },
      headers,
    );

    const companyB = await registerCompany(
      http,
      paths,
      { name: `E2E Update B ${u}`, email: bOwner, password: "StrongPassword123!" },
      headers,
    );

    const bOwnerSession = await login(
      http,
      paths,
      { email: bOwner, password: "StrongPassword123!", rememberUser: false },
      headers,
    );

    await registerCompanyUser(
      http,
      paths,
      bOwnerSession,
      {
        companyId: companyB.companyId,
        firstName: "B",
        lastName: "Admin",
        email: bAdmin,
        password: "StrongPassword123!",
        role: "admin",
        language: "en",
      },
      headers,
    );

    const bAdminSession = await login(
      http,
      paths,
      { email: bAdmin, password: "StrongPassword123!", rememberUser: false },
      headers,
    );

    const patchRes = await http.patch<ApiResponse<Record<string, never>>, { title: string }>(
      paths.vacancies.getById(vacancy.vacancyId),
      { title: "Hacked Title" },
      {
        cookies: bAdminSession.cookies,
        headers: { ...headers, authorization: `Bearer ${bAdminSession.accessToken}` },
      },
    );

    expect(patchRes.status).toBe(401);
    expect(readErrorCode(patchRes.body)).toBe("OWNERSHIP_REQUIRED");
  });
});
