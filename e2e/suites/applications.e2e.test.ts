import path from "path";
import { createHttpClient } from "../helpers/http";
import { e2eEnv } from "../helpers/env";
import type { Paths } from "../helpers/flows";
import {
  applyVacancy,
  createVacancy,
  listMyApplications,
  listVacancyApplications,
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

describe("E2E Applications", () => {
  const { baseUrl, fingerprint } = e2eEnv();
  const http = createHttpClient(baseUrl);
  const headers = makeHeaders(fingerprint);

  test("Candidate applies -> company lists applications -> candidate lists my applications", async () => {
    const u = unique();

    const companyOwnerEmail = `company.apps.${u}@example.com`;
    const companyUserEmail = `apps.owner.${u}@example.com`;
    const candidateEmail = `apply.candidate.${u}@example.com`;

    const createdCompany = await registerCompany(
      http,
      paths,
      {
        name: `E2E Company Apps ${u}`,
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
      },
      headers,
    );

    const vacancy = await createVacancy(
      http,
      paths,
      companySession,
      {
        title: "Backend Engineer",
        description: "E2E apply flow",
        location: "Remote",
        jobType: "remote",
      },
      headers,
    );

    await registerCandidate(
      http,
      paths,
      {
        firstName: "Apply",
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
      },
      headers,
    );

    const cvPath = path.resolve(process.cwd(), "e2e", "fixtures", "cv.pdf");

    const applied = await applyVacancy(
      http,
      paths,
      candidateSession,
      vacancy.vacancyId,
      {
        coverLetter: "E2E cover letter",
        filePath: cvPath,
      },
      headers,
    );

    expect(applied.vacancyId).toBe(vacancy.vacancyId);

    const appsForVacancy = await listVacancyApplications(
      http,
      paths,
      companySession,
      vacancy.vacancyId,
      headers,
    );

    expect(appsForVacancy.some((a) => a.vacancyId === vacancy.vacancyId)).toBe(true);
    expect(
      appsForVacancy.some(
        (a) => typeof a.candidate?.email === "string" && a.candidate.email.length > 0,
      ),
    ).toBe(true);

    const myApps = await listMyApplications(http, paths, candidateSession, headers);
    expect(myApps.some((a) => a.vacancyId === vacancy.vacancyId)).toBe(true);
  });
});
