import type { Request, Response, NextFunction } from "express";

export function attachMockUserMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) {
    return next();
  }

  req.user = {
    id: req.auth.userId,
    company: "DecomplexCompany",
    position: "EventManager",
  };

  next();
}
