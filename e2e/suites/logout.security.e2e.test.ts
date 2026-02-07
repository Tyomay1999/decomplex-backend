import { createHttpClient } from "../helpers/http";
import { e2eEnv } from "../helpers/env";
import type { ApiResponse } from "../helpers/types";
import type { Paths } from "../helpers/flows";
import { login, registerCandidate } from "../helpers/flows";

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

const uniqEmail = (prefix: string): string => `${prefix}.${Date.now()}@example.com`;

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

describe("E2E Logout Security", () => {
  const { baseUrl, fingerprint } = e2eEnv();
  const http = createHttpClient(baseUrl);
  const headers = makeHeaders(fingerprint);

  test("Refresh after logout should be rejected", async () => {
    const email = uniqEmail("logout.refresh.e2e");

    await registerCandidate(
      http,
      paths,
      {
        firstName: "Logout",
        lastName: "Security",
        email,
        password: "StrongPassword123!",
        language: "en",
      },
      headers,
    );

    const session = await login(
      http,
      paths,
      { email, password: "StrongPassword123!", rememberUser: true },
      headers,
    );

    if (typeof session.refreshToken !== "string") {
      throw new Error("Expected refreshToken on rememberUser=true");
    }

    const logoutRes = await http.patch<
      ApiResponse<Record<string, never>>,
      { refreshToken?: string }
    >(
      paths.auth.logout,
      { refreshToken: session.refreshToken },
      { cookies: session.cookies, headers: withBearer(headers, session.accessToken) },
    );

    expect(logoutRes.status).toBe(200);

    const refreshRes = await http.post<
      ApiResponse<Record<string, never>>,
      { refreshToken: string }
    >(
      paths.auth.refresh,
      { refreshToken: session.refreshToken },
      { cookies: session.cookies, headers },
    );

    expect(refreshRes.status).toBe(401);

    const code = readErrorCode(refreshRes.body);
    expect(code === "REFRESH_TOKEN_REVOKED" || code === "INVALID_REFRESH_TOKEN").toBe(true);
  });
});
