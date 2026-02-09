import { createHttpClient } from "../helpers/http";
import { e2eEnv } from "../helpers/env";
import type { ApiResponse, CreateVacancyPayload, VacancyItem } from "../helpers/types";
import type { Paths } from "../helpers/flows";
import { createVacancy, login, registerCompany, registerCompanyUser } from "../helpers/flows";

type VacanciesPaged = { vacancies: VacancyItem[]; nextCursor: string | null };

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

const stringifyBody = (body: unknown): string => {
  try {
    return typeof body === "string" ? body : JSON.stringify(body);
  } catch {
    return String(body);
  }
};

const ensureSuccess = <T>(res: { status: number; body: unknown }, name: string): ApiResponse<T> => {
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`${name} failed: ${res.status} body=${stringifyBody(res.body)}`);
  }
  if (!isObject(res.body)) {
    throw new Error(`${name} invalid body: ${stringifyBody(res.body)}`);
  }
  const api = res.body as ApiResponse<T>;
  if (api.success !== true) {
    throw new Error(`${name} success=false body=${stringifyBody(res.body)}`);
  }
  return api;
};

describe("E2E Pagination", () => {
  const { baseUrl, fingerprint } = e2eEnv();
  const http = createHttpClient(baseUrl);
  const baseHeaders = makeHeaders(fingerprint);

  test("Vacancies list supports cursor pagination without overlaps", async () => {
    const u = uniq();

    const ownerEmail = `company.owner.page.${u}@example.com`;
    const userEmail = `company.user.page.${u}@example.com`;

    const created = await registerCompany(
      http,
      paths,
      { name: `E2E Company Pagination ${u}`, email: ownerEmail, password: "StrongPassword123!" },
      baseHeaders,
    );

    const ownerSession = await login(
      http,
      paths,
      { email: ownerEmail, password: "StrongPassword123!", rememberUser: false },
      baseHeaders,
    );

    await registerCompanyUser(
      http,
      paths,
      ownerSession,
      {
        companyId: created.companyId,
        firstName: "Page",
        lastName: "Owner",
        email: userEmail,
        password: "StrongPassword123!",
        role: "admin",
        language: "en",
      },
      baseHeaders,
    );

    const companySession = await login(
      http,
      paths,
      { email: userEmail, password: "StrongPassword123!", rememberUser: false },
      baseHeaders,
    );

    const payloads: CreateVacancyPayload[] = Array.from({ length: 6 }).map((_, i) => ({
      title: `Pagination Vacancy ${u} ${i}`,
      description: `Pagination vacancy description ${u} ${i} long enough`,
      location: "Yerevan",
      jobType: "full_time",
    }));

    for (const p of payloads) {
      await createVacancy(http, paths, companySession, p, baseHeaders);
    }

    const authHeaders = {
      ...baseHeaders,
      authorization: `Bearer ${companySession.accessToken}`,
    };

    const listPage = async (cursor?: string): Promise<VacanciesPaged> => {
      const q = new URLSearchParams();
      q.set("companyId", created.companyId);
      q.set("status", "active");
      q.set("limit", "2");
      if (typeof cursor === "string" && cursor.length > 0) q.set("cursor", cursor);

      const res = await http.get<ApiResponse<VacanciesPaged>>(`${paths.vacancies.list}?${q}`, {
        cookies: companySession.cookies,
        headers: authHeaders,
      });

      const api = ensureSuccess<VacanciesPaged>(
        { status: res.status, body: res.body },
        "listVacanciesPaged",
      );

      return api.data;
    };

    const p1 = await listPage();
    expect(p1.vacancies.length).toBeGreaterThan(0);
    expect(p1.vacancies.length).toBeLessThanOrEqual(2);
    expect(typeof p1.nextCursor === "string" || p1.nextCursor === null).toBe(true);

    const ids1 = new Set(p1.vacancies.map((v) => v.id));

    if (!p1.nextCursor) {
      throw new Error("Expected nextCursor to be non-null for page 1 with >limit items");
    }

    const p2 = await listPage(p1.nextCursor);
    expect(p2.vacancies.length).toBeGreaterThan(0);
    expect(p2.vacancies.length).toBeLessThanOrEqual(2);

    for (const v of p2.vacancies) {
      expect(ids1.has(v.id)).toBe(false);
    }

    const ids2 = new Set(p2.vacancies.map((v) => v.id));

    if (p2.nextCursor) {
      const p3 = await listPage(p2.nextCursor);
      for (const v of p3.vacancies) {
        expect(ids1.has(v.id)).toBe(false);
        expect(ids2.has(v.id)).toBe(false);
      }
    }
  });
});
