import type { NextFunction, Request, Response } from "express";
import { archiveVacancyAction } from "../../actions/archiveVacancy.action";
import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";
import * as vacancyMethods from "../../../../database/methods/vacancyMethods";

jest.mock("../../../../database/methods/vacancyMethods");

const getVacancyByIdMock = jest.mocked(vacancyMethods.getVacancyById);
const updateVacancyByIdMock = jest.mocked(vacancyMethods.updateVacancyById);

function makeR(id: string, user?: unknown): Request<{ id: string }> {
  const req = makeReq() as Request<{ id: string }>;
  req.params = { id };
  if (user) (req as unknown as { user: unknown }).user = user;
  return req;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("archiveVacancyAction", () => {
  test("returns 200 when archived", async () => {
    getVacancyByIdMock.mockResolvedValue({ id: "v", companyId: "c" } as never);
    updateVacancyByIdMock.mockResolvedValue({ id: "v", status: "archived" } as never);

    const req = makeR("11111111-1111-4111-8111-111111111111", {
      userType: "company",
      id: "u",
      companyId: "c",
      email: "e",
      role: "admin",
      language: "en",
    });

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await archiveVacancyAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(getVacancyByIdMock).toHaveBeenCalledTimes(1);
    expect(updateVacancyByIdMock).toHaveBeenCalledTimes(1);

    expect(updateVacancyByIdMock).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111", {
      status: "archived",
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { vacancy: expect.objectContaining({ status: "archived" }) },
      }),
    );
  });

  test("calls next(error) when user not company", async () => {
    const req = makeR("11111111-1111-4111-8111-111111111111", {
      userType: "candidate",
      id: "cand",
      language: "en",
    });

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await archiveVacancyAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(getVacancyByIdMock).toHaveBeenCalledTimes(0);
    expect(updateVacancyByIdMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });

  test("calls next(error) when vacancy not found", async () => {
    getVacancyByIdMock.mockResolvedValue(null);

    const req = makeR("11111111-1111-4111-8111-111111111111", {
      userType: "company",
      id: "u",
      companyId: "c",
      email: "e",
      role: "admin",
      language: "en",
    });

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await archiveVacancyAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(updateVacancyByIdMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });

  test("calls next(error) when ownership mismatch", async () => {
    getVacancyByIdMock.mockResolvedValue({ id: "v", companyId: "c2" } as never);

    const req = makeR("11111111-1111-4111-8111-111111111111", {
      userType: "company",
      id: "u",
      companyId: "c",
      email: "e",
      role: "admin",
      language: "en",
    });

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await archiveVacancyAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(updateVacancyByIdMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });
});
