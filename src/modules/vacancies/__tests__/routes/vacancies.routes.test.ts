import type { NextFunction, Request, Response, RequestHandler } from "express";
import { Router } from "express";

import { vacanciesRouter } from "../../vacancies.routes";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

import * as vacancyMethods from "../../../../database/methods/vacancyMethods";
import * as applicationMethods from "../../../../database/methods/applicationMethods";

jest.mock("../../../../database/methods/vacancyMethods");
jest.mock("../../../../database/methods/applicationMethods");

jest.mock("../../../../middleware/fingerprint", () => ({
  fingerprintMiddleware: (req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock("../../../../middleware/auth", () => ({
  auth: (req: Request, _res: Response, next: NextFunction) => {
    const t = req.headers["x-test-user-type"];
    if (t === "company") {
      (req as unknown as { user: unknown }).user = {
        userType: "company",
        id: "u",
        companyId: "c",
        email: "e",
        role: "admin",
        language: "en",
      };
    }
    if (t === "candidate") {
      (req as unknown as { user: unknown }).user = {
        userType: "candidate",
        id: "cand",
        language: "en",
      };
    }
    return next();
  },
}));

jest.mock("../../../../middleware/requireCompanyRole", () => ({
  requireCompanyRole: () => (req: Request, _res: Response, next: NextFunction) => {
    const ok = req.headers["x-test-user-type"] === "company";
    if (!ok) return next(new Error("x"));
    return next();
  },
}));

jest.mock("../../../../middleware/requireCandidate", () => ({
  requireCandidate: (req: Request, _res: Response, next: NextFunction) => {
    const ok = req.headers["x-test-user-type"] === "candidate";
    if (!ok) return next(new Error("x"));
    return next();
  },
}));

jest.mock("../../../../middleware/saveUserFile", () => ({
  saveUserFileMiddleware: (req: Request, _res: Response, next: NextFunction) => {
    const v = req.headers["x-test-file-url"];
    if (typeof v === "string" && v.length > 0) {
      (req as unknown as { fileInfo: unknown }).fileInfo = {
        url: v,
        path: "p",
        fileName: "f",
        size: 1,
        company: "",
        position: "",
        userId: "",
      };
    }
    return next();
  },
}));

const listVacanciesPagedMock = jest.mocked(vacancyMethods.listVacanciesPaged);
const getVacancyByIdMock = jest.mocked(vacancyMethods.getVacancyById);
const createVacancyMock = jest.mocked(vacancyMethods.createVacancy);
const updateVacancyByIdMock = jest.mocked(vacancyMethods.updateVacancyById);

const createApplicationMock = jest.mocked(applicationMethods.createApplication);
const listApplicationsByVacancyPagedMock = jest.mocked(
  applicationMethods.listApplicationsByVacancyPaged,
);

function makeApiRouter(): Router {
  const router = Router();
  router.use("/vacancies", vacanciesRouter);
  return router;
}

function handle(router: Router, req: Request, res: Response, next: NextFunction): Promise<void> {
  return new Promise((resolve) => {
    let done = false;

    const resolveOnce = (): void => {
      if (done) return;
      done = true;
      resolve();
    };

    const nextWrapped: NextFunction = ((err?: unknown) => {
      (next as unknown as jest.Mock)(err);
      resolveOnce();
    }) as NextFunction;

    const jsonFn = res.json as unknown as jest.Mock | undefined;
    const sendFn = res.send as unknown as jest.Mock | undefined;
    const endOriginal = res.end ? res.end.bind(res) : undefined;

    if (jsonFn) {
      const original = jsonFn;
      (res as unknown as { json: jest.Mock }).json = jest.fn((...args: unknown[]) => {
        const ret = original(...args);
        resolveOnce();
        return ret;
      });
    }

    if (sendFn) {
      const original = sendFn;
      (res as unknown as { send: jest.Mock }).send = jest.fn((...args: unknown[]) => {
        const ret = original(...args);
        resolveOnce();
        return ret;
      });
    }

    if (endOriginal) {
      res.end = ((...args: Parameters<Response["end"]>) => {
        const ret = endOriginal(...args);
        resolveOnce();
        return ret;
      }) as Response["end"];
    }

    const fn = router as unknown as RequestHandler;
    fn(req, res, nextWrapped);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Vacancies router-level", () => {
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
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          vacancies: [{ id: "v" }],
        }),
      }),
    );
  });

  test("GET /vacancies calls next(error) when query invalid", async () => {
    const router = makeApiRouter();

    const req = makeReq({
      query: {
        limit: "0",
      },
    }) as Request;

    req.method = "GET";
    req.url = "/vacancies";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(listVacanciesPagedMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });

  test("GET /vacancies/:id returns 200 for company user", async () => {
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

  test("POST /vacancies returns 201 for company user", async () => {
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

  test("PATCH /vacancies/:id returns 200 for company user", async () => {
    getVacancyByIdMock.mockResolvedValue({ id: "v", companyId: "c" } as never);
    updateVacancyByIdMock.mockResolvedValue({ id: "v", title: "abc" } as never);

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

    req.method = "PATCH";
    req.url = "/vacancies/11111111-1111-4111-8111-111111111111";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(updateVacancyByIdMock).toHaveBeenCalledTimes(1);
    expect(updateVacancyByIdMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ title: "abc" }),
    );

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

  test("GET /vacancies/:id/applications returns 200 for company user", async () => {
    getVacancyByIdMock.mockResolvedValue({ id: "v", companyId: "c" } as never);
    listApplicationsByVacancyPagedMock.mockResolvedValue({
      items: [
        {
          id: "a",
          candidate: { id: "x", email: "e", firstName: "f", lastName: "l", language: "en" },
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
        }),
      }),
    );
  });
});
