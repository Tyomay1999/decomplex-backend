import type { NextFunction, Request, Response } from "express";
import { applyVacancyAction } from "../../actions/applyVacancy.action";
import { getVacancyById } from "../../../../database/methods/vacancyMethods";
import { createApplication } from "../../../../database/methods/applicationMethods";

jest.mock("../../../../database/methods/vacancyMethods");
jest.mock("../../../../database/methods/applicationMethods");

const getVacancyByIdMock = getVacancyById as unknown as jest.Mock;
const createApplicationMock = createApplication as unknown as jest.Mock;

function createRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function createNext() {
  return jest.fn() as unknown as NextFunction;
}

describe("applyVacancyAction", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("creates application and returns 201", async () => {
    getVacancyByIdMock.mockResolvedValueOnce({ id: "v" });
    createApplicationMock.mockResolvedValueOnce({ id: "a" });

    const req = {
      params: { id: "v" },
      user: { userType: "candidate", id: "cand", language: "en" },
      fileInfo: {
        url: "u",
        path: "p",
        fileName: "f",
        size: 1,
        company: "",
        position: "",
        userId: "",
      },
      body: { coverLetter: "x" },
    } as unknown as Request;

    const res = createRes();
    const next = createNext();

    await applyVacancyAction(req, res, next);

    expect(createApplicationMock).toHaveBeenCalledWith({
      vacancyId: "v",
      candidateId: "cand",
      cvFilePath: "u",
      coverLetter: "x",
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { application: { id: "a" } } });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when vacancy not found", async () => {
    getVacancyByIdMock.mockResolvedValueOnce(null);

    const req = {
      params: { id: "v" },
      user: { userType: "candidate", id: "cand", language: "en" },
      fileInfo: {
        url: "u",
        path: "p",
        fileName: "f",
        size: 1,
        company: "",
        position: "",
        userId: "",
      },
      body: {},
    } as unknown as Request;

    const res = createRes();
    const next = createNext();

    await applyVacancyAction(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("calls next with conflict on unique constraint error", async () => {
    getVacancyByIdMock.mockResolvedValueOnce({ id: "v" });

    const err = { name: "SequelizeUniqueConstraintError" };
    createApplicationMock.mockRejectedValueOnce(err);

    const req = {
      params: { id: "v" },
      user: { userType: "candidate", id: "cand", language: "en" },
      fileInfo: {
        url: "u",
        path: "p",
        fileName: "f",
        size: 1,
        company: "",
        position: "",
        userId: "",
      },
      body: {},
    } as unknown as Request;

    const res = createRes();
    const next = createNext();

    await applyVacancyAction(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
