import type { NextFunction, Request, Response } from "express";
import { createVacancyAction } from "../../actions/createVacancy.action";
import { createVacancy } from "../../../../database/methods/vacancyMethods";

jest.mock("../../../../database/methods/vacancyMethods");

const createVacancyMock = createVacancy as unknown as jest.Mock;

function createRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function createNext() {
  return jest.fn() as unknown as NextFunction;
}

describe("createVacancyAction", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("creates vacancy and returns 201", async () => {
    createVacancyMock.mockResolvedValueOnce({ id: "v" });

    const req = {
      user: {
        userType: "company",
        id: "u",
        companyId: "c",
        role: "admin",
        language: "en",
        email: "e",
      },
      body: {
        title: "t",
        description: "dddddddddd",
        salaryFrom: null,
        salaryTo: null,
        jobType: "remote",
        location: null,
      },
    } as unknown as Request;

    const res = createRes();
    const next = createNext();

    await createVacancyAction(req, res, next);

    expect(createVacancyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "c",
        createdById: "u",
        title: "t",
        description: "dddddddddd",
        jobType: "remote",
        status: "active",
      }),
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { vacancy: { id: "v" } } });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when company user missing", async () => {
    const req = { body: {} } as unknown as Request;
    const res = createRes();
    const next = createNext();

    await createVacancyAction(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
