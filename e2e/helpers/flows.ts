import type { HttpClient } from "./http";
import type {
  ApiResponse,
  ApplicationItem,
  ApplyVacancyData,
  AuthSession,
  CandidateRegisterPayload,
  CompanyRegisterPayload,
  CompanyUserRegisterPayload,
  CreateVacancyData,
  CreateVacancyPayload,
  HttpResult,
  LoginData,
  LoginPayload,
  MeData,
  MyApplicationsData,
  RefreshData,
  RegisterCompanyData,
  VacanciesListData,
  VacancyApplicationsData,
  VacancyApplicationItem,
  VacancyItem,
} from "./types";

export type Paths = {
  auth: {
    registerCandidate: string;
    registerCompany: string;
    registerCompanyUser: string;
    login: string;
    refresh: string;
    me: string;
    logout: string;
  };
  vacancies: {
    create: string;
    list: string;
    getById: (id: string) => string;
    apply: (id: string) => string;
    listApplications: (id: string) => string;
  };
  applications: {
    listMine: string;
  };
};

export type CreatedCompany = {
  companyId: string;
};

export type CreatedVacancy = {
  vacancyId: string;
};

export type GetVacancyByIdData = {
  vacancy: VacancyItem;
};

const stringifyBody = (body: unknown): string => {
  try {
    return typeof body === "string" ? body : JSON.stringify(body);
  } catch {
    return String(body);
  }
};

const fail = (name: string, res: { status: number; body: unknown }): never => {
  throw new Error(`${name} failed: ${res.status} body=${stringifyBody(res.body)}`);
};

const ensureApiSuccess = <T>(name: string, res: HttpResult<ApiResponse<T>>): ApiResponse<T> => {
  if (res.status < 200 || res.status >= 300) fail(name, res);
  const body = res.body;
  if (typeof body !== "object" || body === null) fail(name, { status: res.status, body });
  const api = body as ApiResponse<T>;
  if (api.success !== true) fail(`${name} returned success=false`, { status: res.status, body });
  return api;
};

const withBearer = (
  headers: Record<string, string>,
  accessToken: string,
): Record<string, string> => ({
  ...headers,
  authorization: `Bearer ${accessToken}`,
});

const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export const registerCandidate = async (
  http: HttpClient,
  paths: Paths,
  payload: CandidateRegisterPayload,
  headers: Record<string, string>,
): Promise<void> => {
  const res = await http.post<ApiResponse<Record<string, never>>, CandidateRegisterPayload>(
    paths.auth.registerCandidate,
    payload,
    { headers },
  );
  ensureApiSuccess("registerCandidate", res);
};

export const registerCompany = async (
  http: HttpClient,
  paths: Paths,
  payload: CompanyRegisterPayload,
  headers: Record<string, string>,
): Promise<CreatedCompany> => {
  const res = await http.post<ApiResponse<RegisterCompanyData>, CompanyRegisterPayload>(
    paths.auth.registerCompany,
    payload,
    { headers },
  );

  const api = ensureApiSuccess("registerCompany", res);
  const data = api.data;
  const companyId = "companyId" in data ? data.companyId : data.company.id;

  return { companyId };
};

export const registerCompanyUser = async (
  http: HttpClient,
  paths: Paths,
  session: AuthSession,
  payload: CompanyUserRegisterPayload,
  headers: Record<string, string>,
): Promise<void> => {
  const res = await http.post<ApiResponse<Record<string, never>>, CompanyUserRegisterPayload>(
    paths.auth.registerCompanyUser,
    payload,
    { cookies: session.cookies, headers: withBearer(headers, session.accessToken) },
  );
  ensureApiSuccess("registerCompanyUser", res);
};

export type AuthSessionWithRefresh = AuthSession & { refreshToken: string };

export const login = async (
  http: HttpClient,
  paths: Paths,
  payload: LoginPayload,
  headers: Record<string, string>,
): Promise<AuthSession> => {
  const res = await http.post<ApiResponse<LoginData>, LoginPayload>(paths.auth.login, payload, {
    headers,
  });

  const api = ensureApiSuccess("login", res);

  const accessToken = api.data.accessToken;
  const refreshToken = api.data.refreshToken;

  if (!isNonEmptyString(accessToken)) {
    throw new Error("login did not return accessToken");
  }

  const rememberUser = (payload as { rememberUser?: unknown }).rememberUser;

  if (rememberUser !== false && typeof rememberUser !== "undefined") {
    if (!isNonEmptyString(refreshToken)) {
      throw new Error("login did not return refreshToken");
    }
    return { cookies: res.cookies, accessToken, refreshToken };
  }

  if (rememberUser === false) {
    return { cookies: res.cookies, accessToken };
  }

  if (isNonEmptyString(refreshToken)) {
    return { cookies: res.cookies, accessToken, refreshToken };
  }

  return { cookies: res.cookies, accessToken };
};

export const refresh = async (
  http: HttpClient,
  paths: Paths,
  session: AuthSession,
  headers: Record<string, string>,
): Promise<AuthSession> => {
  if (!isNonEmptyString(session.refreshToken)) {
    throw new Error("refresh: session.refreshToken is missing");
  }

  const res = await http.post<ApiResponse<RefreshData>, { refreshToken: string }>(
    paths.auth.refresh,
    { refreshToken: session.refreshToken },
    { cookies: session.cookies, headers },
  );

  const api = ensureApiSuccess("refresh", res);

  const nextAccess = isNonEmptyString(api.data.accessToken)
    ? api.data.accessToken
    : session.accessToken;

  const nextRefresh = isNonEmptyString(api.data.refreshToken)
    ? api.data.refreshToken
    : session.refreshToken;

  const nextCookies = res.cookies.length > 0 ? res.cookies : session.cookies;

  return { cookies: nextCookies, accessToken: nextAccess, refreshToken: nextRefresh };
};

export const me = async (
  http: HttpClient,
  paths: Paths,
  session: AuthSession,
  headers: Record<string, string>,
): Promise<MeData> => {
  const res = await http.get<ApiResponse<MeData>>(paths.auth.me, {
    cookies: session.cookies,
    headers: withBearer(headers, session.accessToken),
  });
  const api = ensureApiSuccess("me", res);
  return api.data;
};

export const createVacancy = async (
  http: HttpClient,
  paths: Paths,
  session: AuthSession,
  payload: CreateVacancyPayload,
  headers: Record<string, string>,
): Promise<CreatedVacancy> => {
  const res = await http.post<ApiResponse<CreateVacancyData>, CreateVacancyPayload>(
    paths.vacancies.create,
    payload,
    { cookies: session.cookies, headers: withBearer(headers, session.accessToken) },
  );

  const api = ensureApiSuccess("createVacancy", res);
  return { vacancyId: api.data.vacancy.id };
};

export const listVacancies = async (
  http: HttpClient,
  paths: Paths,
  session: AuthSession,
  headers: Record<string, string>,
): Promise<VacancyItem[]> => {
  const res = await http.get<ApiResponse<VacanciesListData>>(paths.vacancies.list, {
    cookies: session.cookies,
    headers: withBearer(headers, session.accessToken),
  });

  const api = ensureApiSuccess("listVacancies", res);
  return api.data.vacancies;
};

export const getVacancyById = async (
  http: HttpClient,
  paths: Paths,
  session: AuthSession,
  vacancyId: string,
  headers: Record<string, string>,
): Promise<VacancyItem> => {
  const res = await http.get<ApiResponse<GetVacancyByIdData>>(paths.vacancies.getById(vacancyId), {
    cookies: session.cookies,
    headers: withBearer(headers, session.accessToken),
  });

  const api = ensureApiSuccess("getVacancyById", res);
  return api.data.vacancy;
};

export const applyVacancy = async (
  http: HttpClient,
  paths: Paths,
  session: AuthSession,
  vacancyId: string,
  args: { coverLetter: string; filePath?: string },
  headers: Record<string, string>,
): Promise<ApplicationItem> => {
  const res = await http.postForm<ApiResponse<ApplyVacancyData>>(
    paths.vacancies.apply(vacancyId),
    {
      fields: { coverLetter: args.coverLetter },
      file:
        typeof args.filePath === "string"
          ? { fieldName: "file", filePath: args.filePath }
          : undefined,
    },
    { cookies: session.cookies, headers: withBearer(headers, session.accessToken) },
  );

  const api = ensureApiSuccess("applyVacancy", res);
  return api.data.application;
};

export const listVacancyApplications = async (
  http: HttpClient,
  paths: Paths,
  session: AuthSession,
  vacancyId: string,
  headers: Record<string, string>,
): Promise<VacancyApplicationItem[]> => {
  const res = await http.get<ApiResponse<VacancyApplicationsData>>(
    paths.vacancies.listApplications(vacancyId),
    {
      cookies: session.cookies,
      headers: withBearer(headers, session.accessToken),
    },
  );

  const api = ensureApiSuccess("listVacancyApplications", res);
  return api.data.items;
};

export const listMyApplications = async (
  http: HttpClient,
  paths: Paths,
  session: AuthSession,
  headers: Record<string, string>,
): Promise<ApplicationItem[]> => {
  const res = await http.get<ApiResponse<MyApplicationsData>>(paths.applications.listMine, {
    cookies: session.cookies,
    headers: withBearer(headers, session.accessToken),
  });

  const api = ensureApiSuccess("listMyApplications", res);
  return api.data.items;
};
