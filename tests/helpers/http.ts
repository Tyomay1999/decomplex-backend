import type { NextFunction, Request, Response } from "express";

type Headers = Record<string, string>;

export type MakeReqOptions = {
  body?: unknown;
  headers?: Headers;
  query?: Record<string, unknown>;
  params?: Record<string, string>;
  fingerprintHash?: string | null;
  fingerprint?: { hash: string };
  user?: unknown;
  ip?: string;
};

const normalizeHeaders = (h?: Headers): Headers => {
  const out: Headers = {};
  if (!h) return out;
  for (const [k, v] of Object.entries(h)) out[k.toLowerCase()] = v;
  return out;
};

export function makeReq(opts: MakeReqOptions = {}): Request {
  const headers = normalizeHeaders(opts.headers);
  const ip = opts.ip ?? "127.0.0.1";

  const req = {
    method: "GET",
    url: "/",
    headers,
    body: opts.body ?? {},
    query: opts.query ?? {},
    params: opts.params ?? {},
    ip,
    socket: { remoteAddress: ip },
    connection: { remoteAddress: ip },
    get: (name: string): string | undefined => headers[name.toLowerCase()],
    header: (name: string): string | undefined => headers[name.toLowerCase()],
    fingerprint: { hash: opts.fingerprintHash ?? null },
    user: opts.user,
  };

  return req as unknown as Request;
}

type ResWithMocks = Response & {
  status: jest.Mock;
  json: jest.Mock;
  send: jest.Mock;
  end: jest.Mock;
  setHeader: jest.Mock;
  getHeader: jest.Mock;
  cookie: jest.Mock;
  clearCookie: jest.Mock;
};

export function makeRes(): ResWithMocks {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
    send: jest.fn(),
    end: jest.fn(),
    setHeader: jest.fn(),
    getHeader: jest.fn(),
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as ResWithMocks;

  res.status.mockImplementation(() => res);
  res.json.mockImplementation(() => res);
  res.send.mockImplementation(() => res);

  return res;
}

export function makeNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}
