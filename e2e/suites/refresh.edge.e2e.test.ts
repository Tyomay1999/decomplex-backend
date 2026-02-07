import { createHttpClient } from "../helpers/http";
import { e2eEnv } from "../helpers/env";
import type { Paths } from "../helpers/flows";
import { login, registerCandidate } from "../helpers/flows";
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

describe("E2E Refresh Edge Cases", () => {
  const { baseUrl } = e2eEnv();
  const http = createHttpClient(baseUrl);

  test("Refresh: invalid refreshToken string -> 401 INVALID_REFRESH_TOKEN", async () => {
    const res = await http.post<ApiResponse<Record<string, never>>, { refreshToken: string }>(
      paths.auth.refresh,
      { refreshToken: "not-a-jwt" },
      { headers: makeHeaders("fp-invalid") },
    );

    expect(res.status).toBe(401);
    expect(readErrorCode(res.body)).toBe("INVALID_REFRESH_TOKEN");
  });

  test("Refresh: token valid but fingerprint mismatch -> 401 REFRESH_TOKEN_REVOKED", async () => {
    const u = unique();
    const email = `edge.refresh.${u}@example.com`;

    await registerCandidate(
      http,
      paths,
      {
        firstName: "Edge",
        lastName: "Refresh",
        email,
        password: "StrongPassword123!",
        language: "en",
      },
      makeHeaders("fp-a"),
    );

    const session = await login(
      http,
      paths,
      { email, password: "StrongPassword123!", rememberUser: true },
      makeHeaders("fp-a"),
    );

    if (typeof session.refreshToken !== "string" || session.refreshToken.length === 0) {
      throw new Error("Expected refreshToken for rememberUser=true");
    }

    const res = await http.post<ApiResponse<Record<string, never>>, { refreshToken: string }>(
      paths.auth.refresh,
      { refreshToken: session.refreshToken },
      { cookies: session.cookies, headers: makeHeaders("fp-b") },
    );

    expect(res.status).toBe(401);
    expect(readErrorCode(res.body)).toBe("REFRESH_TOKEN_REVOKED");
  });
});
