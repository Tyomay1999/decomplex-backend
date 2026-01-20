import type { Request } from "express";
import { Router } from "express";

import "../routes/_mocks";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

import { vacanciesRouter } from "../../vacancies.routes";
import { fingerprintMiddleware } from "../../../../middleware/fingerprint";

import * as vacancyMethods from "../../../../database/methods/vacancyMethods";
import * as applicationMethods from "../../../../database/methods/applicationMethods";
import { handle } from "./_routerHarness";

jest.mock("../../../../database/methods/vacancyMethods");
jest.mock("../../../../database/methods/applicationMethods");

const getVacancyByIdMock = jest.mocked(vacancyMethods.getVacancyById);
const listApplicationsByVacancyPagedMock = jest.mocked(
  applicationMethods.listApplicationsByVacancyPaged,
);

function makeApiRouter(): Router {
  const router = Router();
  router.use(fingerprintMiddleware);
  router.use("/vacancies", vacanciesRouter);
  return router;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("vacancies router-level: list applications", () => {
  test("GET /vacancies/:id/applications returns 200 for company", async () => {
    getVacancyByIdMock.mockResolvedValue({ id: "v", companyId: "c" } as never);

    listApplicationsByVacancyPagedMock.mockResolvedValue({
      items: [
        {
          id: "a",
          vacancyId: "v",
          candidateId: "cand",
          cvFilePath: "u",
          coverLetter: null,
          status: "applied",
          createdAt: new Date(),
          updatedAt: new Date(),
          candidate: { id: "cand", email: "e", firstName: "f", lastName: "l", language: "en" },
        },
      ],
      nextCursor: null,
    } as never);

    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "company",
      },
      query: {
        limit: "10",
      },
    }) as Request;

    req.method = "GET";
    req.url = "/vacancies/11111111-1111-4111-8111-111111111111/applications";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(0);
    expect(listApplicationsByVacancyPagedMock).toHaveBeenCalledTimes(1);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          items: expect.any(Array),
          nextCursor: null,
        }),
      }),
    );
  });

  test("GET /vacancies/:id/applications calls next(error) when id invalid", async () => {
    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "company",
      },
      query: {},
    }) as Request;

    req.method = "GET";
    req.url = "/vacancies/x/applications";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(listApplicationsByVacancyPagedMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });

  test("GET /vacancies/:id/applications calls next(error) when not company", async () => {
    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "candidate",
      },
      query: {},
    }) as Request;

    req.method = "GET";
    req.url = "/vacancies/11111111-1111-4111-8111-111111111111/applications";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(listApplicationsByVacancyPagedMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });
});
