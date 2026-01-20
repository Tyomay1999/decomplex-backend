import { Router } from "express";
import type { Request } from "express";

import "../../../../../tests/helpers/http";
import "../routes/_mocks";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

import { vacanciesRouter } from "../../vacancies.routes";
import { fingerprintMiddleware } from "../../../../middleware/fingerprint";

import * as vacancyMethods from "../../../../database/methods/vacancyMethods";
import { handle } from "./_routerHarness";

jest.mock("../../../../database/methods/vacancyMethods");

const listVacanciesPagedMock = jest.mocked(vacancyMethods.listVacanciesPaged);
const getVacancyByIdMock = jest.mocked(vacancyMethods.getVacancyById);

function makeApiRouter(): Router {
  const router = Router();
  router.use(fingerprintMiddleware);
  router.use("/vacancies", vacanciesRouter);
  return router;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("vacancies router-level: list/get", () => {
  test("GET /vacancies returns 200", async () => {
    listVacanciesPagedMock.mockResolvedValue({
      items: [{ id: "v" }] as never,
      nextCursor: null,
    });

    const router = makeApiRouter();

    const req = makeReq({
      query: {
        limit: "10",
        q: "x",
      },
    }) as Request;

    req.method = "GET";
    req.url = "/vacancies";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(0);
    expect(listVacanciesPagedMock).toHaveBeenCalledTimes(1);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        vacancies: [{ id: "v" }],
        nextCursor: null,
      },
    });
  });

  test("GET /vacancies/:id returns 200", async () => {
    getVacancyByIdMock.mockResolvedValue({ id: "v" } as never);

    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "company",
      },
    }) as Request;

    req.method = "GET";
    req.url = "/vacancies/11111111-1111-4111-8111-111111111111";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(0);
    expect(getVacancyByIdMock).toHaveBeenCalledTimes(1);

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

  test("GET /vacancies/:id calls next(error) when not found", async () => {
    getVacancyByIdMock.mockResolvedValue(null);

    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "company",
      },
    }) as Request;

    req.method = "GET";
    req.url = "/vacancies/11111111-1111-4111-8111-111111111111";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).toHaveBeenCalledTimes(0);
  });

  test("GET /vacancies/:id passes viewerCandidateId for candidate", async () => {
    getVacancyByIdMock.mockResolvedValue({ id: "v", hasApplied: true } as never);

    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "candidate",
      },
    }) as Request;

    req.method = "GET";
    req.url = "/vacancies/11111111-1111-4111-8111-111111111111";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(0);
    expect(getVacancyByIdMock).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111", {
      viewerCandidateId: "cand",
    });
  });
});
