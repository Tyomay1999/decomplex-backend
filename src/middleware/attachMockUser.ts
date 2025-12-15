import type { NextFunction, Request, Response } from "express";

export function attachMockUser(_req: Request, _res: Response, next: NextFunction): void {
  _req.user = {
    userType: "company",
    id: "mock-user-id",
    companyId: "DecomplexCompany",
    position: "admin",
    language: "en",
  };

  _req.auth = { userId: "mock-user-id" };

  return next();
}
