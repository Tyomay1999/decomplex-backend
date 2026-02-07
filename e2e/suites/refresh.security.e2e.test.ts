import { createHttpClient } from "../helpers/http";
import { e2eEnv } from "../helpers/env";
import type { ApiResponse } from "../helpers/types";
import type { Paths } from "../helpers/flows";
import { login, refresh, registerCandidate } from "../helpers/flows";

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

const uniq = (prefix: string): string => `${prefix}.${Date.now()}@example.com`;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

const readErrorCode = (body: unknown): string | null => {
  if (!isObject(body)) return null;
  const err = body["error"];
  if (!isObject(err)) return null;
  const code = err["code"];
  return typeof code === "string" ? code : null;
};

describe("E2E Refresh Security", () => {
  const { baseUrl, fingerprint } = e2eEnv();
  const http = createHttpClient(baseUrl);
  const headers = makeHeaders(fingerprint);

  test("Refresh token reuse should be rejected", async () => {
    const email = uniq("reuse.refresh.e2e");

    await registerCandidate(
      http,
      paths,
      {
        firstName: "Reuse",
        lastName: "Token",
        email,
        password: "StrongPassword123!",
        language: "en",
      },
      headers,
    );

    const session1 = await login(
      http,
      paths,
      { email, password: "StrongPassword123!", rememberUser: true },
      headers,
    );
    if (typeof session1.refreshToken !== "string") {
      throw new Error("Expected refreshToken on rememberUser=true");
    }

    const oldRefresh = session1.refreshToken;

    const session2 = await refresh(http, paths, session1, headers);
    if (typeof session2.refreshToken !== "string") {
      throw new Error("Expected refreshToken after refresh");
    }

    const reuseRes = await http.post<ApiResponse<Record<string, never>>, { refreshToken: string }>(
      paths.auth.refresh,
      { refreshToken: oldRefresh },
      { cookies: session2.cookies, headers },
    );

    expect(reuseRes.status).toBe(401);

    const code = readErrorCode(reuseRes.body);
    expect(code === "REFRESH_TOKEN_REVOKED" || code === "INVALID_REFRESH_TOKEN").toBe(true);
  });
});
