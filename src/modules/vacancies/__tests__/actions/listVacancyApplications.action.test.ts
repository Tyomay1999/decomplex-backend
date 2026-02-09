import type { NextFunction, Request, Response } from "express";
import { listVacancyApplicationsAction } from "../../actions/listVacancyApplications.action";
import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";
import * as vacancyMethods from "../../../../database/methods/vacancyMethods";
import * as applicationMethods from "../../../../database/methods/applicationMethods";
import type { ApplicationStatus } from "../../../../domain/types";
import { VacancyEntity } from "../../../../database/methods/vacancyMethods";
import { ApplicationWithCandidateEntity } from "../../../../database/methods/applicationMethods";

jest.mock("../../../../database/methods/vacancyMethods");
jest.mock("../../../../database/methods/applicationMethods");

const getVacancyByIdMock = jest.mocked(vacancyMethods.getVacancyById);
const listApplicationsByVacancyPagedMock = jest.mocked(
  applicationMethods.listApplicationsByVacancyPaged,
);

type Role = "admin" | "recruiter";
type Lang = "en" | "hy" | "ru";

type UserCompany = {
  userType: "company";
  id: string;
  companyId: string;
  email: string;
  role: Role;
  language: Lang;
  position?: string;
};

type ValidatedParams = { id: string };

type ValidatedQuery = {
  limit?: number;
  cursor?: string;
  status?: ApplicationStatus;
  q?: string;
};

type ReqExt = Request & {
  user?: UserCompany;
  validatedParams?: ValidatedParams;
  validatedVacancyApplicationsQuery?: ValidatedQuery;
};

type AwaitedValue<T> = T extends Promise<infer U> ? U : T;

type VacancyReturned = NonNullable<AwaitedValue<ReturnType<typeof vacancyMethods.getVacancyById>>>;
type ApplicationsPage = AwaitedValue<
  ReturnType<typeof applicationMethods.listApplicationsByVacancyPaged>
>;
type ApplicationItem = ApplicationsPage["items"][number];

function makeVacancy(overrides?: Partial<VacancyEntity>): VacancyEntity {
  const now = new Date();
  const base: VacancyEntity = {
    id: "v1",
    companyId: "c1",
    createdById: null,
    title: "t",
    description: "d",
    salaryFrom: null,
    salaryTo: null,
    jobType: "remote",
    location: null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  return { ...base, ...(overrides ?? {}) };
}

function makeApplicationItem(
  overrides?: Partial<ApplicationWithCandidateEntity>,
): ApplicationWithCandidateEntity {
  const now = new Date();
  const base: ApplicationWithCandidateEntity = {
    id: "a1",
    vacancyId: "v1",
    candidateId: "cand1",
    status: "applied",
    cvFilePath: "cv.pdf",
    createdAt: now,
    updatedAt: now,
    coverLetter: null,
    candidate: {
      id: "cand1",
      email: "a@b.com",
      firstName: "A",
      lastName: "B",
      language: "en",
    },
  };
  return { ...base, ...(overrides ?? {}) };
}

function makeR(id: string, user?: UserCompany, query?: ValidatedQuery): ReqExt {
  const req = makeReq() as unknown as ReqExt;

  req.validatedParams = { id };

  if (user) req.user = user;
  if (query) req.validatedVacancyApplicationsQuery = query;

  return req;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("listVacancyApplicationsAction", () => {
  test("returns 200 with items and nextCursor", async () => {
    const vacancyBase = makeVacancy({ id: "v", companyId: "c" });

    const vacancy: VacancyReturned = { ...(vacancyBase as VacancyReturned), hasApplied: undefined };

    const item = makeApplicationItem({
      id: "a",
      vacancyId: "11111111-1111-4111-8111-111111111111",
      candidateId: "cand1",
      status: "applied",
    });

    const page: ApplicationsPage = {
      items: [item as unknown as ApplicationItem],
      nextCursor: "n",
    };

    getVacancyByIdMock.mockResolvedValue(vacancy);
    listApplicationsByVacancyPagedMock.mockResolvedValue(page);

    const req = makeR(
      "11111111-1111-4111-8111-111111111111",
      {
        userType: "company",
        id: "u",
        companyId: "c",
        role: "admin",
        language: "en",
        email: "e",
      },
      {
        limit: 10,
        cursor: "c",
        status: "applied",
        q: "x",
      },
    );

    const res = makeRes() as unknown as Response;
    const next = makeNext() as unknown as NextFunction;

    await listVacancyApplicationsAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(getVacancyByIdMock).toHaveBeenCalledTimes(1);
    expect(getVacancyByIdMock).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111");

    expect(listApplicationsByVacancyPagedMock).toHaveBeenCalledTimes(1);
    expect(listApplicationsByVacancyPagedMock).toHaveBeenCalledWith({
      vacancyId: "11111111-1111-4111-8111-111111111111",
      limit: 10,
      cursor: "c",
      status: "applied",
      q: "x",
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        items: [
          expect.objectContaining({
            id: "a",
            vacancyId: "11111111-1111-4111-8111-111111111111",
            candidateId: "cand1",
            status: "applied",
            cvFilePath: "cv.pdf",
            coverLetter: null,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            candidate: expect.objectContaining({
              id: "cand1",
              email: "a@b.com",
              firstName: "A",
              lastName: "B",
              language: "en",
            }),
          }),
        ],
        nextCursor: "n",
      },
    });
  });

  test("calls next(error) when vacancy not found", async () => {
    getVacancyByIdMock.mockResolvedValue(null);

    const req = makeR("11111111-1111-4111-8111-111111111111", {
      userType: "company",
      id: "u",
      companyId: "c",
      role: "admin",
      language: "en",
      email: "e",
    });

    const res = makeRes() as unknown as Response;
    const next = makeNext() as unknown as NextFunction;

    await listVacancyApplicationsAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).toHaveBeenCalledTimes(0);
    expect(listApplicationsByVacancyPagedMock).toHaveBeenCalledTimes(0);
  });

  test("calls next(error) when ownership mismatch", async () => {
    const vacancyBase = makeVacancy({ id: "v", companyId: "other" });
    const vacancy: VacancyReturned = { ...(vacancyBase as VacancyReturned), hasApplied: undefined };

    getVacancyByIdMock.mockResolvedValue(vacancy);

    const req = makeR("11111111-1111-4111-8111-111111111111", {
      userType: "company",
      id: "u",
      companyId: "c",
      role: "admin",
      language: "en",
      email: "e",
    });

    const res = makeRes() as unknown as Response;
    const next = makeNext() as unknown as NextFunction;

    await listVacancyApplicationsAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).toHaveBeenCalledTimes(0);
    expect(listApplicationsByVacancyPagedMock).toHaveBeenCalledTimes(0);
  });
});
