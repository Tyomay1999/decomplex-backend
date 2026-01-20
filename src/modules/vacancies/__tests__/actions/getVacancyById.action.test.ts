import type { NextFunction, Request, Response } from "express";
import type { ParsedQs } from "qs";
import { getVacancyByIdAction } from "../../actions/getVacancyById.action";
import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";
import * as vacancyMethods from "../../../../database/methods/vacancyMethods";

jest.mock("../../../../database/methods/vacancyMethods");

const getVacancyByIdMock = jest.mocked(vacancyMethods.getVacancyById);

function makeR(id: string, user?: unknown): Request<{ id: string }, unknown, unknown, ParsedQs> {
  const req = makeReq() as Request<{ id: string }, unknown, unknown, ParsedQs>;
  req.params = { id };
  if (user) (req as unknown as { user: unknown }).user = user;
  return req;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getVacancyByIdAction", () => {
  test("returns 200 when vacancy found", async () => {
    getVacancyByIdMock.mockResolvedValue({ id: "v" } as never);

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

    await getVacancyByIdAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(getVacancyByIdMock).toHaveBeenCalledTimes(1);
    expect(getVacancyByIdMock).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111", {
      viewerCandidateId: undefined,
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { vacancy: expect.objectContaining({ id: "v" }) },
      }),
    );
  });

  test("passes viewerCandidateId when candidate", async () => {
    getVacancyByIdMock.mockResolvedValue({ id: "v", hasApplied: true } as never);

    const req = makeR("11111111-1111-4111-8111-111111111111", {
      userType: "candidate",
      id: "cand",
      language: "en",
    });

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await getVacancyByIdAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(getVacancyByIdMock).toHaveBeenCalledTimes(1);
    expect(getVacancyByIdMock).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111", {
      viewerCandidateId: "cand",
    });
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

    await getVacancyByIdAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).toHaveBeenCalledTimes(0);
  });
});
