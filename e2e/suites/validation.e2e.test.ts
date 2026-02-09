import { createHttpClient } from "../helpers/http";
import { e2eEnv } from "../helpers/env";
import type { Paths } from "../helpers/flows";
import { login, registerCandidate, registerCompany, registerCompanyUser } from "../helpers/flows";
import type { ApiResponse } from "../helpers/types";

type ApiError = { code?: string; message?: string; details?: unknown };

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

const readError = (body: unknown): ApiError => {
  if (!isObject(body)) return {};
  const maybeError = body["error"];
  if (!isObject(maybeError)) return {};
  const code = typeof maybeError["code"] === "string" ? maybeError["code"] : undefined;
  const message = typeof maybeError["message"] === "string" ? maybeError["message"] : undefined;
  const details = maybeError["details"];
  return { code, message, details };
};

describe("E2E Validation", () => {
  const { baseUrl, fingerprint } = e2eEnv();
  const http = createHttpClient(baseUrl);
  const headers = makeHeaders(fingerprint);

  test("Create vacancy: invalid jobType -> 422 VALIDATION_FAILED", async () => {
    const u = unique();

    const ownerEmail = `val.owner.${u}@example.com`;
    const adminEmail = `val.admin.${u}@example.com`;

    const companyRes = await registerCompany(
      http,
      paths,
      { name: `E2E Val Company ${u}`, email: ownerEmail, password: "StrongPassword123!" },
      headers,
    );

    const ownerSession = await login(
      http,
      paths,
      { email: ownerEmail, password: "StrongPassword123!", rememberUser: false },
      headers,
    );

    await registerCompanyUser(
      http,
      paths,
      ownerSession,
      {
        companyId: companyRes.companyId,
        firstName: "Val",
        lastName: "Admin",
        email: adminEmail,
        password: "StrongPassword123!",
        role: "admin",
        language: "en",
      },
      headers,
    );

    const adminSession = await login(
      http,
      paths,
      { email: adminEmail, password: "StrongPassword123!", rememberUser: false },
      headers,
    );

    const res = await http.post<ApiResponse<Record<string, never>>, Record<string, unknown>>(
      paths.vacancies.create,
      {
        title: "Frontend Engineer",
        description: "E2E vacancy description",
        location: "Yerevan",
        jobType: "contract",
      },
      {
        cookies: adminSession.cookies,
        headers: { ...headers, authorization: `Bearer ${adminSession.accessToken}` },
      },
    );

    expect(res.status).toBe(422);
    expect(readError(res.body).code).toBe("VALIDATION_FAILED");
  });

  test("Create vacancy: salaryFrom > salaryTo -> 422 VALIDATION_FAILED", async () => {
    const u = unique();

    const ownerEmail = `val2.owner.${u}@example.com`;
    const adminEmail = `val2.admin.${u}@example.com`;

    const companyRes = await registerCompany(
      http,
      paths,
      { name: `E2E Val2 Company ${u}`, email: ownerEmail, password: "StrongPassword123!" },
      headers,
    );

    const ownerSession = await login(
      http,
      paths,
      { email: ownerEmail, password: "StrongPassword123!", rememberUser: false },
      headers,
    );

    await registerCompanyUser(
      http,
      paths,
      ownerSession,
      {
        companyId: companyRes.companyId,
        firstName: "Val2",
        lastName: "Admin",
        email: adminEmail,
        password: "StrongPassword123!",
        role: "admin",
        language: "en",
      },
      headers,
    );

    const adminSession = await login(
      http,
      paths,
      { email: adminEmail, password: "StrongPassword123!", rememberUser: false },
      headers,
    );

    const res = await http.post<ApiResponse<Record<string, never>>, Record<string, unknown>>(
      paths.vacancies.create,
      {
        title: "Backend Engineer",
        description: "E2E vacancy description",
        location: "Remote",
        jobType: "remote",
        salaryFrom: 2000,
        salaryTo: 1000,
      },
      {
        cookies: adminSession.cookies,
        headers: { ...headers, authorization: `Bearer ${adminSession.accessToken}` },
      },
    );

    expect(res.status).toBe(422);
    expect(readError(res.body).code).toBe("VALIDATION_FAILED");
  });

  test("List vacancies: invalid limit -> 422 VALIDATION_FAILED", async () => {
    const res = await http.get<ApiResponse<Record<string, never>>>(
      `${paths.vacancies.list}?limit=999`,
      { headers },
    );
    expect(res.status).toBe(422);
    expect(readError(res.body).code).toBe("VALIDATION_FAILED");
  });

  test("Apply vacancy: missing file -> 422 VALIDATION_FAILED", async () => {
    const u = unique();
    const candidateEmail = `val.cand.${u}@example.com`;

    await registerCandidate(
      http,
      paths,
      {
        firstName: "Val",
        lastName: "Candidate",
        email: candidateEmail,
        password: "StrongPassword123!",
        language: "en",
      },
      headers,
    );

    const session = await login(
      http,
      paths,
      { email: candidateEmail, password: "StrongPassword123!", rememberUser: false },
      headers,
    );

    const fakeId = "00000000-0000-0000-0000-000000000000";

    const res = await http.post<ApiResponse<Record<string, never>>, Record<string, unknown>>(
      paths.vacancies.apply(fakeId),
      { coverLetter: "E2E cover letter" },
      {
        cookies: session.cookies,
        headers: { ...headers, authorization: `Bearer ${session.accessToken}` },
      },
    );

    expect(res.status).toBe(422);
    expect(readError(res.body).code).toBe("VALIDATION_FAILED");
  });
});
