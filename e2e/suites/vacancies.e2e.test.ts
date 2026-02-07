import { createHttpClient } from "../helpers/http";
import { e2eEnv } from "../helpers/env";
import type { Paths } from "../helpers/flows";
import {
  createVacancy,
  getVacancyById,
  listVacancies,
  login,
  registerCandidate,
  registerCompany,
  registerCompanyUser,
} from "../helpers/flows";

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

describe("E2E Vacancies", () => {
  const { baseUrl, fingerprint } = e2eEnv();
  const http = createHttpClient(baseUrl);
  const headers = makeHeaders(fingerprint);

  test("Company creates vacancy -> candidate lists -> get by id", async () => {
    const u = unique();

    const companyOwnerEmail = `company.vac.${u}@example.com`;
    const companyUserEmail = `vac.owner.${u}@example.com`;
    const candidateEmail = `list.candidate.${u}@example.com`;

    const createdCompany = await registerCompany(
      http,
      paths,
      {
        name: `E2E Company Vacancies ${u}`,
        email: companyOwnerEmail,
        password: "StrongPassword123!",
      },
      headers,
    );

    const ownerSession = await login(
      http,
      paths,
      {
        email: companyOwnerEmail,
        password: "StrongPassword123!",
        rememberUser: true,
      },
      headers,
    );

    await registerCompanyUser(
      http,
      paths,
      ownerSession,
      {
        companyId: createdCompany.companyId,
        firstName: "Vac",
        lastName: "Owner",
        email: companyUserEmail,
        password: "StrongPassword123!",
        role: "admin",
        language: "en",
      },
      headers,
    );

    const companySession = await login(
      http,
      paths,
      {
        email: companyUserEmail,
        password: "StrongPassword123!",
        rememberUser: true,
      },
      headers,
    );

    const vacancy = await createVacancy(
      http,
      paths,
      companySession,
      {
        title: "Frontend Engineer",
        description: "E2E vacancy",
        location: "Yerevan",
        jobType: "part_time",
      },
      headers,
    );

    await registerCandidate(
      http,
      paths,
      {
        firstName: "List",
        lastName: "Candidate",
        email: candidateEmail,
        password: "StrongPassword123!",
        language: "en",
      },
      headers,
    );

    const candidateSession = await login(
      http,
      paths,
      {
        email: candidateEmail,
        password: "StrongPassword123!",
        rememberUser: true,
      },
      headers,
    );

    const items = await listVacancies(http, paths, candidateSession, headers);
    expect(items.some((v) => v.id === vacancy.vacancyId)).toBe(true);

    const fetched = await getVacancyById(http, paths, candidateSession, vacancy.vacancyId, headers);
    expect(fetched.id).toBe(vacancy.vacancyId);
    expect(fetched.title).toBe("Frontend Engineer");
  });
});
