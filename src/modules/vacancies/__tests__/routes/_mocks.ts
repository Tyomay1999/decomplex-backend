import type { NextFunction, Request, Response } from "express";

jest.mock("../../../../middleware/fingerprint", () => ({
  fingerprintMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
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
    const url = req.headers["x-test-file-url"];
    if (typeof url === "string" && url.length > 0) {
      (req as unknown as { fileInfo: unknown }).fileInfo = {
        url,
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
