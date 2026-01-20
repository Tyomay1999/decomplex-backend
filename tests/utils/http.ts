import type { NextFunction, Request, Response } from "express";

type HeaderStore = Record<string, string | undefined>;

export function makeReq<TBody = unknown>(
  body?: TBody,
): Request<unknown, unknown, TBody> & { __headers: HeaderStore } {
  const headers: HeaderStore = {};

  const req = {
    body: body as TBody,
    __headers: headers,
    header: (name: string): string | undefined => {
      const key = name.toLowerCase();
      return headers[key];
    },
    get: (name: string): string | undefined => {
      const key = name.toLowerCase();
      return headers[key];
    },
  } as unknown as Request<unknown, unknown, TBody> & { __headers: HeaderStore };

  return req;
}

export function setHeader(req: { __headers: HeaderStore }, name: string, value: string): void {
  req.__headers[name.toLowerCase()] = value;
}

export function makeRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  return res;
}

export function makeNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}
