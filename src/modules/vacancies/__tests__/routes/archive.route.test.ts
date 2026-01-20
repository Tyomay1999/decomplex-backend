import type { Request } from "express";
import { Router } from "express";

import "../routes/_mocks";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

import { vacanciesRouter } from "../../vacancies.routes";
import { fingerprintMiddleware } from "../../../../middleware/fingerprint";

import * as vacancyMethods from "../../../../database/methods/vacancyMethods";
import { handle } from "./_routerHarness";

jest.mock("../../../../database/methods/vacancyMethods");

const getVacancyByIdMock = jest.mocked(vacancyMethods.getVacancyById);
const updateVacancyByIdMock = jest.mocked(vacancyMethods.updateVacancyById);

function makeApiRouter(): Router {
  const router = Router();
  router.use(fingerprintMiddleware);
  router.use("/vacancies", vacanciesRouter);
  return router;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("vacancies router-level: archive", () => {
  test("DELETE /vacancies/:id returns 200 for company", async () => {
    getVacancyByIdMock.mockResolvedValue({ id: "v", companyId: "c" } as never);
    updateVacancyByIdMock.mockResolvedValue({ id: "v", status: "archived" } as never);

    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "company",
      },
    }) as Request;

    req.method = "DELETE";
    req.url = "/vacancies/11111111-1111-4111-8111-111111111111";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(0);
    expect(updateVacancyByIdMock).toHaveBeenCalledTimes(1);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          vacancy: expect.objectContaining({ status: "archived" }),
        }),
      }),
    );
  });

  test("DELETE /vacancies/:id calls next(error) when not company", async () => {
    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "candidate",
      },
    }) as Request;

    req.method = "DELETE";
    req.url = "/vacancies/11111111-1111-4111-8111-111111111111";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(updateVacancyByIdMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });
});
