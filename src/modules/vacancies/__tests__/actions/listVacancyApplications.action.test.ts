import type { NextFunction, Request, Response } from "express";
import type { ParsedQs } from "qs";
import { listVacancyApplicationsAction } from "../../actions/listVacancyApplications.action";
import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";
import * as vacancyMethods from "../../../../database/methods/vacancyMethods";
import * as applicationMethods from "../../../../database/methods/applicationMethods";
import type { ApplicationStatus } from "../../../../domain/types";

jest.mock("../../../../database/methods/vacancyMethods");
jest.mock("../../../../database/methods/applicationMethods");

const getVacancyByIdMock = jest.mocked(vacancyMethods.getVacancyById);
const listApplicationsByVacancyPagedMock = jest.mocked(
  applicationMethods.listApplicationsByVacancyPaged,
);

type Q = ParsedQs & {
  limit?: string;
  cursor?: string;
  status?: ApplicationStatus;
  q?: string;
};

function makeR(
  id: string,
  user?: unknown,
  query?: Q,
): Request<{ id: string }, unknown, unknown, Q> {
  const req = makeReq() as Request<{ id: string }, unknown, unknown, Q>;
  req.params = { id };
  if (user) (req as unknown as { user: unknown }).user = user;
  if (query) req.query = query;
  return req;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("listVacancyApplicationsAction", () => {
  test("returns 200 with items and nextCursor", async () => {
    getVacancyByIdMock.mockResolvedValue({ id: "v", companyId: "c" } as never);
    listApplicationsByVacancyPagedMock.mockResolvedValue({
      items: [{ id: "a" }],
      nextCursor: "n",
    } as never);

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
        limit: "10",
        cursor: "c",
        status: "applied",
        q: "x",
      },
    );

    const res = makeRes() as Response;
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
      data: { items: [{ id: "a" }], nextCursor: "n" },
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

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await listVacancyApplicationsAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).toHaveBeenCalledTimes(0);
    expect(listApplicationsByVacancyPagedMock).toHaveBeenCalledTimes(0);
  });

  test("calls next(error) when ownership mismatch", async () => {
    getVacancyByIdMock.mockResolvedValue({ id: "v", companyId: "other" } as never);

    const req = makeR("11111111-1111-4111-8111-111111111111", {
      userType: "company",
      id: "u",
      companyId: "c",
      role: "admin",
      language: "en",
      email: "e",
    });

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await listVacancyApplicationsAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).toHaveBeenCalledTimes(0);
    expect(listApplicationsByVacancyPagedMock).toHaveBeenCalledTimes(0);
  });
});
