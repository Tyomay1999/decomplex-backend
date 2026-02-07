import { createHttpClient } from "../helpers/http";
import { e2eEnv } from "../helpers/env";
import type { Paths } from "../helpers/flows";
import { registerCandidate, registerCompany } from "../helpers/flows";
import type { ApiResponse, LoginData, MeData } from "../helpers/types";

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

const stringifyBody = (body: unknown): string => {
  try {
    return typeof body === "string" ? body : JSON.stringify(body);
  } catch {
    return String(body);
  }
};

const fail = (name: string, status: number, body: unknown): never => {
  throw new Error(`${name} failed: ${status} body=${stringifyBody(body)}`);
};

const ensureApiSuccess = <T>(
  name: string,
  res: { status: number; body: unknown },
): ApiResponse<T> => {
  if (res.status < 200 || res.status >= 300) fail(name, res.status, res.body);
  if (typeof res.body !== "object" || res.body === null) fail(name, res.status, res.body);

  const api = res.body as ApiResponse<T>;

  if (api.success !== true) {
    fail(`${name} returned success=false`, res.status, res.body);
  }

  return api;
};

type AuthSession = {
  cookies: string[];
  accessToken: string;
  refreshToken: string;
};

type LoginBody = {
  email: string;
  password: string;
  rememberUser: true;
};

type RefreshBody = {
  refreshToken: string;
};

type TokensData = {
  accessToken: string;
  refreshToken?: string;
};

describe("E2E Auth", () => {
  const { baseUrl, fingerprint } = e2eEnv();
  const http = createHttpClient(baseUrl);
  const headers = makeHeaders(fingerprint);

  const loginWithRefresh = async (email: string, password: string): Promise<AuthSession> => {
    const res = await http.post<ApiResponse<LoginData>, LoginBody>(
      paths.auth.login,
      { email, password, rememberUser: true },
      { headers },
    );

    const api = ensureApiSuccess<LoginData>("login", { status: res.status, body: res.body });

    const accessToken = api.data.accessToken;
    const refreshToken = api.data.refreshToken;

    if (typeof accessToken !== "string" || accessToken.length === 0) {
      throw new Error("login did not return accessToken");
    }

    if (typeof refreshToken !== "string" || refreshToken.length === 0) {
      throw new Error("login did not return refreshToken");
    }

    const cookies = res.cookies;

    return { cookies, accessToken, refreshToken };
  };

  const meCall = async (session: { cookies: string[]; accessToken: string }): Promise<MeData> => {
    const res = await http.get<ApiResponse<MeData>>(paths.auth.me, {
      cookies: session.cookies,
      headers: { ...headers, authorization: `Bearer ${session.accessToken}` },
    });

    const api = ensureApiSuccess<MeData>("me", { status: res.status, body: res.body });

    return api.data;
  };

  test("Candidate register -> login -> me", async () => {
    const email = uniq("john.candidate.e2e");

    await registerCandidate(
      http,
      paths,
      {
        firstName: "John",
        lastName: "Candidate",
        email,
        password: "StrongPassword123!",
        language: "en",
      },
      headers,
    );

    const session = await loginWithRefresh(email, "StrongPassword123!");
    const meDto = await meCall(session);

    expect(meDto.user.email).toBe(email);
    expect(meDto.userType).toBe("candidate");
  });

  test("Company register -> company user register -> login -> me", async () => {
    const ownerEmail = uniq("company.owner.e2e");
    const managerEmail = uniq("alice.manager.e2e");

    const created = await registerCompany(
      http,
      paths,
      {
        name: "E2E Company",
        email: ownerEmail,
        password: "StrongPassword123!",
      },
      headers,
    );

    const ownerSession = await loginWithRefresh(ownerEmail, "StrongPassword123!");

    const registerUserRes = await http.post<
      ApiResponse<Record<string, never>>,
      {
        companyId: string;
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        role: "admin" | "manager";
        language: "en" | "ru" | "hy";
      }
    >(
      paths.auth.registerCompanyUser,
      {
        companyId: created.companyId,
        firstName: "Alice",
        lastName: "Manager",
        email: managerEmail,
        password: "StrongPassword123!",
        role: "admin",
        language: "en",
      },
      {
        cookies: ownerSession.cookies,
        headers: { ...headers, authorization: `Bearer ${ownerSession.accessToken}` },
      },
    );

    ensureApiSuccess<Record<string, never>>("registerCompanyUser", {
      status: registerUserRes.status,
      body: registerUserRes.body,
    });

    const managerSession = await loginWithRefresh(managerEmail, "StrongPassword123!");
    const meDto = await meCall(managerSession);

    expect(meDto.user.email).toBe(managerEmail);
    expect(meDto.userType).toBe("company");
  });

  test("Login -> refresh -> me", async () => {
    const email = uniq("bob.refresh.e2e");

    await registerCandidate(
      http,
      paths,
      {
        firstName: "Bob",
        lastName: "Refresh",
        email,
        password: "StrongPassword123!",
        language: "en",
      },
      headers,
    );

    const session1 = await loginWithRefresh(email, "StrongPassword123!");

    const refreshRes = await http.post<ApiResponse<TokensData>, RefreshBody>(
      paths.auth.refresh,
      { refreshToken: session1.refreshToken },
      { cookies: session1.cookies, headers },
    );

    const refreshed = ensureApiSuccess<TokensData>("refresh", {
      status: refreshRes.status,
      body: refreshRes.body,
    }).data;

    if (typeof refreshed.accessToken !== "string" || refreshed.accessToken.length === 0) {
      throw new Error("refresh did not return accessToken");
    }

    const session2 = {
      cookies: refreshRes.cookies.length > 0 ? refreshRes.cookies : session1.cookies,
      accessToken: refreshed.accessToken,
    };

    const meDto = await meCall(session2);

    expect(meDto.user.email).toBe(email);
    expect(meDto.userType).toBe("candidate");
  });

  test("Login: wrong password -> 401", async () => {
    const email = uniq("neg.login.wrongpass");

    await registerCandidate(
      http,
      paths,
      {
        firstName: "Neg",
        lastName: "WrongPass",
        email,
        password: "StrongPassword123!",
        language: "en",
      },
      headers,
    );

    const res = await http.post<
      ApiResponse<LoginData>,
      { email: string; password: string; rememberUser: true }
    >(paths.auth.login, { email, password: "WrongPassword!!!", rememberUser: true }, { headers });

    expect(res.status).toBe(401);
  });

  test("ME: without Authorization header -> 401", async () => {
    const res = await http.get<ApiResponse<MeData>>(paths.auth.me, {
      cookies: [],
      headers,
    });

    expect(res.status).toBe(401);
  });

  test("ME: malformed Authorization header -> 401", async () => {
    const res = await http.get<ApiResponse<MeData>>(paths.auth.me, {
      cookies: [],
      headers: { ...headers, authorization: "Bearer not-a-jwt" },
    });

    expect(res.status).toBe(401);
  });

  test("Refresh: invalid refreshToken string -> 401 INVALID_REFRESH_TOKEN", async () => {
    const res = await http.post<ApiResponse<TokensData>, RefreshBody>(
      paths.auth.refresh,
      { refreshToken: "not-a-jwt" },
      { cookies: [], headers },
    );

    expect(res.status).toBe(401);

    if (typeof res.body === "object" && res.body !== null) {
      const b = res.body as { code?: unknown; message?: unknown; error?: unknown };
      const code =
        typeof (b as { code?: unknown }).code === "string"
          ? (b as { code: string }).code
          : typeof (b.error as { code?: unknown } | undefined)?.code === "string"
            ? (b.error as { code: string }).code
            : null;

      if (code) expect(code).toBe("INVALID_REFRESH_TOKEN");
    }
  });

  test("Login (rememberUser=false) should NOT return refreshToken", async () => {
    const email = uniq("neg.login.norefresh");

    await registerCandidate(
      http,
      paths,
      {
        firstName: "No",
        lastName: "Refresh",
        email,
        password: "StrongPassword123!",
        language: "en",
      },
      headers,
    );

    const res = await http.post<
      ApiResponse<LoginData>,
      { email: string; password: string; rememberUser: false }
    >(
      paths.auth.login,
      { email, password: "StrongPassword123!", rememberUser: false },
      { headers },
    );

    expect(res.status).toBe(200);

    const body = res.body as ApiResponse<LoginData>;
    expect(body.success).toBe(true);

    const rt = (body.data as { refreshToken?: unknown }).refreshToken;
    expect(rt === undefined || rt === null || rt === "").toBe(true);
  });

  test("Refresh: token valid but fingerprint mismatch -> 401 REFRESH_TOKEN_REVOKED", async () => {
    const email = uniq("refresh.fp.mismatch");

    await registerCandidate(
      http,
      paths,
      {
        firstName: "FP",
        lastName: "Mismatch",
        email,
        password: "StrongPassword123!",
        language: "en",
      },
      headers,
    );

    const session = await loginWithRefresh(email, "StrongPassword123!");

    const otherHeaders = {
      ...headers,
      "x-client-fingerprint": `${fingerprint}-other`,
    };

    const res = await http.post<ApiResponse<TokensData>, RefreshBody>(
      paths.auth.refresh,
      { refreshToken: session.refreshToken },
      { cookies: session.cookies, headers: otherHeaders },
    );

    expect(res.status).toBe(401);

    if (typeof res.body === "object" && res.body !== null) {
      const b = res.body as { code?: unknown; message?: unknown; error?: unknown };
      const code =
        typeof (b as { code?: unknown }).code === "string"
          ? (b as { code: string }).code
          : typeof (b.error as { code?: unknown } | undefined)?.code === "string"
            ? (b.error as { code: string }).code
            : null;

      if (code) expect(code).toBe("REFRESH_TOKEN_REVOKED");
    }
  });
});
