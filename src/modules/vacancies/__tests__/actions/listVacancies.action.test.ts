import type { NextFunction, Request, Response } from "express";
import { listVacanciesAction } from "../../actions/listVacancies.action";
import { listVacanciesPaged } from "../../../../database/methods/vacancyMethods";

jest.mock("../../../../database/methods/vacancyMethods");

const listVacanciesPagedMock = listVacanciesPaged as unknown as jest.Mock;

function createRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function createNext() {
  return jest.fn() as unknown as NextFunction;
}

describe("listVacanciesAction", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns 200 with items and nextCursor", async () => {
    listVacanciesPagedMock.mockResolvedValueOnce({
      items: [{ id: "1" }],
      nextCursor: "c",
    });

    const req = {
      query: {
        companyId: "cid",
        status: "active",
        jobType: "remote",
        q: "x",
        limit: "10",
        cursor: "cur",
      },
    } as unknown as Request;

    const res = createRes();
    const next = createNext();

    await listVacanciesAction(req, res, next);

    expect(listVacanciesPagedMock).toHaveBeenCalledWith({
      companyId: "cid",
      status: "active",
      jobType: "remote",
      q: "x",
      limit: 10,
      cursor: "cur",
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { vacancies: [{ id: "1" }], nextCursor: "c" },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("uses default limit when invalid", async () => {
    listVacanciesPagedMock.mockResolvedValueOnce({ items: [], nextCursor: null });

    const req = { query: { limit: "x" } } as unknown as Request;
    const res = createRes();
    const next = createNext();

    await listVacanciesAction(req, res, next);

    expect(listVacanciesPagedMock).toHaveBeenCalledWith(expect.objectContaining({ limit: 20 }));
  });

  it("clamps limit to max 50", async () => {
    listVacanciesPagedMock.mockResolvedValueOnce({ items: [], nextCursor: null });

    const req = { query: { limit: "999" } } as unknown as Request;
    const res = createRes();
    const next = createNext();

    await listVacanciesAction(req, res, next);

    expect(listVacanciesPagedMock).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }));
  });

  it("passes error to next", async () => {
    const err = new Error("x");
    listVacanciesPagedMock.mockRejectedValueOnce(err);

    const req = { query: {} } as unknown as Request;
    const res = createRes();
    const next = createNext();

    await listVacanciesAction(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
