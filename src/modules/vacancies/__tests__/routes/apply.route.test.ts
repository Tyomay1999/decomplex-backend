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
const createApplicationMock = jest.mocked(applicationMethods.createApplication);

function makeApiRouter(): Router {
  const router = Router();
  router.use(fingerprintMiddleware);
  router.use("/vacancies", vacanciesRouter);
  return router;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("vacancies router-level: apply", () => {
  test("POST /vacancies/:id/apply returns 201 for candidate", async () => {
    getVacancyByIdMock.mockResolvedValue({ id: "v" } as never);
    createApplicationMock.mockResolvedValue({ id: "a" } as never);

    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "candidate",
        "x-test-file-url": "u",
      },
      body: {
        coverLetter: "x",
      },
    }) as Request;

    req.method = "POST";
    req.url = "/vacancies/11111111-1111-4111-8111-111111111111/apply";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(0);
    expect(createApplicationMock).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          application: expect.objectContaining({ id: "a" }),
        }),
      }),
    );
  });

  test("POST /vacancies/:id/apply calls next(error) when not candidate", async () => {
    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "company",
        "x-test-file-url": "u",
      },
      body: {
        coverLetter: "x",
      },
    }) as Request;

    req.method = "POST";
    req.url = "/vacancies/11111111-1111-4111-8111-111111111111/apply";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(createApplicationMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });

  test("POST /vacancies/:id/apply calls next(error) when file missing", async () => {
    getVacancyByIdMock.mockResolvedValue({ id: "v" } as never);

    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "candidate",
      },
      body: {
        coverLetter: "x",
      },
    }) as Request;

    req.method = "POST";
    req.url = "/vacancies/11111111-1111-4111-8111-111111111111/apply";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(createApplicationMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });
});
