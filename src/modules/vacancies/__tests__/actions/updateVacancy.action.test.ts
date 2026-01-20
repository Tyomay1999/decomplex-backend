import type { NextFunction, Request, Response } from "express";
import type { ParsedQs } from "qs";
import { updateVacancyAction } from "../../actions/updateVacancy.action";
import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";
import * as vacancyMethods from "../../../../database/methods/vacancyMethods";

jest.mock("../../../../database/methods/vacancyMethods");

const getVacancyByIdMock = jest.mocked(vacancyMethods.getVacancyById);
const updateVacancyByIdMock = jest.mocked(vacancyMethods.updateVacancyById);

type Body = Record<string, unknown>;

function makeR(
  id: string,
  body: Body,
  user?: unknown,
): Request<{ id: string }, unknown, Body, ParsedQs> {
  const req = makeReq() as Request<{ id: string }, unknown, Body, ParsedQs>;
  req.params = { id };
  req.body = body;
  if (user) (req as unknown as { user: unknown }).user = user;
  return req;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("updateVacancyAction", () => {
  test("returns 200 when updated", async () => {
    getVacancyByIdMock.mockResolvedValue({ id: "v", companyId: "c" } as never);
    updateVacancyByIdMock.mockResolvedValue({ id: "v", title: "x" } as never);

    const req = makeR(
      "11111111-1111-4111-8111-111111111111",
      { title: "x" },
      {
        userType: "company",
        id: "u",
        companyId: "c",
        email: "e",
        role: "admin",
        language: "en",
      },
    );

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await updateVacancyAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(getVacancyByIdMock).toHaveBeenCalledTimes(1);
    expect(updateVacancyByIdMock).toHaveBeenCalledTimes(1);

    expect(updateVacancyByIdMock).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111", {
      title: "x",
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { vacancy: expect.objectContaining({ id: "v" }) },
      }),
    );
  });

  test("calls next(error) when user not company", async () => {
    const req = makeR(
      "11111111-1111-4111-8111-111111111111",
      { title: "x" },
      {
        userType: "candidate",
        id: "cand",
        language: "en",
      },
    );

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await updateVacancyAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(getVacancyByIdMock).toHaveBeenCalledTimes(0);
    expect(updateVacancyByIdMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });

  test("calls next(error) when vacancy not found", async () => {
    getVacancyByIdMock.mockResolvedValue(null);

    const req = makeR(
      "11111111-1111-4111-8111-111111111111",
      { title: "x" },
      {
        userType: "company",
        id: "u",
        companyId: "c",
        email: "e",
        role: "admin",
        language: "en",
      },
    );

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await updateVacancyAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(updateVacancyByIdMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });

  test("calls next(error) when ownership mismatch", async () => {
    getVacancyByIdMock.mockResolvedValue({ id: "v", companyId: "c2" } as never);

    const req = makeR(
      "11111111-1111-4111-8111-111111111111",
      { title: "x" },
      {
        userType: "company",
        id: "u",
        companyId: "c",
        email: "e",
        role: "admin",
        language: "en",
      },
    );

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await updateVacancyAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(updateVacancyByIdMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });
});
