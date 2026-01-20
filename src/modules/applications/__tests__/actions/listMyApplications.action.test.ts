import type { NextFunction, Request, Response } from "express";
import { listMyApplicationsAction } from "../../actions/listMyApplications.action";
import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";
import * as applicationMethods from "../../../../database/methods/applicationMethods";

jest.mock("../../../../database/methods/applicationMethods");

const listMyApplicationsPagedMock = jest.mocked(applicationMethods.listMyApplicationsPaged);

interface Q {
  limit?: string;
  cursor?: string;
}

function makeR(query: Q, user?: unknown): Request<unknown, unknown, unknown, Q> {
  const req = makeReq() as Request<unknown, unknown, unknown, Q>;
  req.query = query;
  if (user) (req as unknown as { user: unknown }).user = user;
  return req;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("listMyApplicationsAction", () => {
  test("returns 200 for candidate and passes params to method", async () => {
    listMyApplicationsPagedMock.mockResolvedValue({
      items: [{ id: "a" }] as never,
      nextCursor: "c",
    });

    const req = makeR(
      { limit: "10", cursor: "x" },
      { userType: "candidate", id: "cand", language: "en" },
    );

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await listMyApplicationsAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(listMyApplicationsPagedMock).toHaveBeenCalledTimes(1);
    expect(listMyApplicationsPagedMock).toHaveBeenCalledWith({
      candidateId: "cand",
      limit: 10,
      cursor: "x",
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        items: [{ id: "a" }],
        nextCursor: "c",
      },
    });
  });

  test("calls next(error) when user missing", async () => {
    const req = makeR({});

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await listMyApplicationsAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(listMyApplicationsPagedMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });

  test("calls next(error) when user not candidate", async () => {
    const req = makeR({}, { userType: "company", id: "u" });

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await listMyApplicationsAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(listMyApplicationsPagedMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });

  test("uses default limit 20 when limit missing", async () => {
    listMyApplicationsPagedMock.mockResolvedValue({
      items: [] as never,
      nextCursor: null,
    });

    const req = makeR({}, { userType: "candidate", id: "cand", language: "en" });

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await listMyApplicationsAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(listMyApplicationsPagedMock).toHaveBeenCalledWith({
      candidateId: "cand",
      limit: 20,
      cursor: undefined,
    });
  });

  test("uses default limit 20 when limit invalid", async () => {
    listMyApplicationsPagedMock.mockResolvedValue({
      items: [] as never,
      nextCursor: null,
    });

    const req = makeR({ limit: "x" }, { userType: "candidate", id: "cand", language: "en" });

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await listMyApplicationsAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(listMyApplicationsPagedMock).toHaveBeenCalledWith({
      candidateId: "cand",
      limit: 20,
      cursor: undefined,
    });
  });

  test("calls next(error) when method throws", async () => {
    listMyApplicationsPagedMock.mockRejectedValue(new Error("x"));

    const req = makeR({}, { userType: "candidate", id: "cand", language: "en" });

    const res = makeRes() as Response;
    const next = makeNext() as unknown as NextFunction;

    await listMyApplicationsAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).toHaveBeenCalledTimes(0);
  });
});
