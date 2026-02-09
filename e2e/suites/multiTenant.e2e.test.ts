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

const unique = (): string => `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

const readErrorCode = (body: unknown): string | undefined => {
  if (!isObject(body)) return undefined;
  const err = body["error"];
  if (!isObject(err)) return undefined;
  return typeof err["code"] === "string" ? err["code"] : undefined;
};

describe("E2E Multi-tenant Authorization", () => {
  const { baseUrl, fingerprint } = e2eEnv();
  const http = createHttpClient(baseUrl);
  const headers = makeHeaders(fingerprint);

  test("Company B cannot manage Company A vacancy -> 401 OWNERSHIP_REQUIRED", async () => {
    const u = unique();

    const aOwner = `mt.a.owner.${u}@example.com`;
    const aAdmin = `mt.a.admin.${u}@example.com`;

    const bOwner = `mt.b.owner.${u}@example.com`;
    const bAdmin = `mt.b.admin.${u}@example.com`;

    const companyA = await registerCompany(
      http,
      paths,
      { name: `E2E MT Company A ${u}`, email: aOwner, password: "StrongPassword123!" },
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
        title: "MT Vacancy",
        description: "Multi tenant vacancy description",
        location: "Yerevan",
        jobType: "hybrid",
      },
      headers,
    );

    const companyB = await registerCompany(
      http,
      paths,
      { name: `E2E MT Company B ${u}`, email: bOwner, password: "StrongPassword123!" },
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

    const patchRes = await http.patch<ApiResponse<Record<string, never>>, Record<string, unknown>>(
      paths.vacancies.getById(vacancy.vacancyId),
      { title: "Hacked Title" },
      {
        cookies: bAdminSession.cookies,
        headers: { ...headers, authorization: `Bearer ${bAdminSession.accessToken}` },
      },
    );

    expect(patchRes.status).toBe(401);
    expect(readErrorCode(patchRes.body)).toBe("OWNERSHIP_REQUIRED");

    const deleteRes = await http.delete<ApiResponse<Record<string, never>>>(
      paths.vacancies.getById(vacancy.vacancyId),
      {
        cookies: bAdminSession.cookies,
        headers: { ...headers, authorization: `Bearer ${bAdminSession.accessToken}` },
      },
    );

    expect(deleteRes.status).toBe(401);
    expect(readErrorCode(deleteRes.body)).toBe("OWNERSHIP_REQUIRED");

    const appsRes = await http.get<ApiResponse<Record<string, never>>>(
      paths.vacancies.listApplications(vacancy.vacancyId),
      {
        cookies: bAdminSession.cookies,
        headers: { ...headers, authorization: `Bearer ${bAdminSession.accessToken}` },
      },
    );

    expect(appsRes.status).toBe(401);
    expect(readErrorCode(appsRes.body)).toBe("OWNERSHIP_REQUIRED");
  });
});
