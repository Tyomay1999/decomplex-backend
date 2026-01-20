import type { NextFunction, Request, Response, RequestHandler } from "express";
import { Router } from "express";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

import { applicationsRouter } from "../../applications.routes";

import * as applicationMethods from "../../../../database/methods/applicationMethods";

jest.mock("../../../../database/methods/applicationMethods");

jest.mock("../../../../middleware/fingerprint", () => ({
  fingerprintMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock("../../../../middleware/auth", () => ({
  auth: (req: Request, _res: Response, next: NextFunction) => {
    const t = req.headers["x-test-user-type"];
    if (t === "candidate") {
      (req as unknown as { user: unknown }).user = {
        userType: "candidate",
        id: "cand",
        language: "en",
      };
    }
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
    return next();
  },
}));

jest.mock("../../../../middleware/requireCandidate", () => ({
  requireCandidate: (req: Request, _res: Response, next: NextFunction) => {
    if (req.headers["x-test-user-type"] !== "candidate") return next(new Error("x"));
    return next();
  },
}));

const listMyApplicationsPagedMock = jest.mocked(applicationMethods.listMyApplicationsPaged);

function makeApiRouter(): Router {
  const router = Router();
  router.use("/applications", applicationsRouter);
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

describe("GET /applications/my (router-level)", () => {
  test("returns 200 and data for candidate", async () => {
    listMyApplicationsPagedMock.mockResolvedValue({
      items: [{ id: "a" }] as never,
      nextCursor: null,
    });

    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "candidate",
      },
      query: {
        limit: "10",
      },
    }) as Request;

    req.method = "GET";
    req.url = "/applications/my";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(listMyApplicationsPagedMock).toHaveBeenCalledTimes(1);
    expect(listMyApplicationsPagedMock).toHaveBeenCalledWith({
      candidateId: "cand",
      limit: 10,
      cursor: undefined,
    });

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        items: [{ id: "a" }],
        nextCursor: null,
      },
    });
  });

  test("calls next(error) when not candidate", async () => {
    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "company",
      },
    }) as Request;

    req.method = "GET";
    req.url = "/applications/my";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(listMyApplicationsPagedMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);
  });

  test("calls next(error) when action deps throws", async () => {
    listMyApplicationsPagedMock.mockRejectedValue(new Error("x"));

    const router = makeApiRouter();

    const req = makeReq({
      headers: {
        "x-test-user-type": "candidate",
      },
    }) as Request;

    req.method = "GET";
    req.url = "/applications/my";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(res.json).toHaveBeenCalledTimes(0);
  });
});
