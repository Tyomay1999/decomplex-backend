import type { Request } from "express";
import { Router } from "express";

import "../routes/_mocks";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

import { vacanciesRouter } from "../../vacancies.routes";
import { fingerprintMiddleware } from "../../../../middleware/fingerprint";

import * as vacancyMethods from "../../../../database/methods/vacancyMethods";
import { handle } from "./_routerHarness";

jest.mock("../../../../database/methods/vacancyMethods");

const createVacancyMock = jest.mocked(vacancyMethods.createVacancy);

function makeApiRouter(): Router {
  const router = Router();
  router.use(fingerprintMiddleware);
  router.use("/vacancies", vacanciesRouter);
  return router;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("vacancies router-level: create", () => {
  test("POST /vacancies returns 201 for company", async () => {
    createVacancyMock.mockResolvedValue({ id: "v" } as never);

    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "company",
      },
      body: {
        title: "abc",
        description: "0123456789",
        jobType: "remote",
        salaryFrom: null,
        salaryTo: null,
        location: null,
      },
    }) as Request;

    req.method = "POST";
    req.url = "/vacancies";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(0);
    expect(createVacancyMock).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          vacancy: expect.objectContaining({ id: "v" }),
        }),
      }),
    );
  });

  test("POST /vacancies calls next(error) when payload invalid", async () => {
    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "company",
      },
      body: {
        title: "a",
        description: "x",
        jobType: "bad",
      },
    }) as Request;

    req.method = "POST";
    req.url = "/vacancies";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(createVacancyMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });

  test("POST /vacancies calls next(error) when not company", async () => {
    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "candidate",
      },
      body: {
        title: "abc",
        description: "0123456789",
        jobType: "remote",
      },
    }) as Request;

    req.method = "POST";
    req.url = "/vacancies";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(createVacancyMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });
});
