import type { NextFunction, Request, Response } from "express";
import { fingerprintMiddleware } from "../fingerprint";
import crypto from "crypto";
import { logger } from "../../lib/logger";

jest.mock("../../lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

function createRes(): Response {
  return {} as Response;
}

function createNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}

function createReq(headers?: Record<string, string>, remoteAddress?: string): Request {
  const h: Record<string, string> = headers ?? {};

  const req: Partial<Request> = {};
  req.headers = h;
  req.socket = { remoteAddress } as Request["socket"];
  req.requestId = "r1";

  req.header = ((name: string) => {
    const key = name.toLowerCase();
    return h[key];
  }) as Request["header"];

  req.get = ((name: string) => {
    const key = name.toLowerCase();
    return h[key];
  }) as Request["get"];

  return req as Request;
}

test("uses x-client-fingerprint when provided", () => {
  const req = createReq({ "x-client-fingerprint": "fp" }, "1.1.1.1");
  const res = createRes();
  const next = createNext();

  fingerprintMiddleware(req, res, next);

  expect(next).toHaveBeenCalledTimes(1);
  expect(req.fingerprint?.hash).toBe("fp");

  expect((logger.debug as unknown as jest.Mock).mock.calls.length).toBe(1);
  const payload = (logger.debug as unknown as jest.Mock).mock.calls[0][0] as unknown;
  expect(payload).toEqual(
    expect.objectContaining({
      requestId: "r1",
      fingerprintHash: "fp",
    }),
  );
});

test("uses x-forwarded-for ip when present", () => {
  const req = createReq({ "x-forwarded-for": "9.9.9.9, 8.8.8.8" }, "2.2.2.2");
  const res = createRes();
  const next = createNext();

  fingerprintMiddleware(req, res, next);

  expect(next).toHaveBeenCalledTimes(1);
  expect(req.fingerprint?.ip).toBe("9.9.9.9");
  expect(typeof req.fingerprint?.hash).toBe("string");
  expect((req.fingerprint?.hash?.length ?? 0) > 0).toBe(true);
});

test("generates sha256 hash when x-client-fingerprint is missing", () => {
  const headers: Record<string, string> = {
    "user-agent": "ua",
    "accept-language": "en",
    origin: "o",
    referer: "r",
  };

  const req = createReq(headers, "2.2.2.2");
  const res = createRes();
  const next = createNext();

  fingerprintMiddleware(req, res, next);

  const rawFingerprintObject = {
    ip: "2.2.2.2",
    userAgent: "ua",
    acceptLanguage: "en",
    origin: "o",
    referer: "r",
  };

  const expected = crypto
    .createHash("sha256")
    .update(JSON.stringify(rawFingerprintObject))
    .digest("hex");

  expect(next).toHaveBeenCalledTimes(1);
  expect(req.fingerprint?.hash).toBe(expected);
  expect(req.fingerprint?.ip).toBe("2.2.2.2");
  expect(req.fingerprint?.userAgent).toBe("ua");
  expect(req.fingerprint?.acceptLanguage).toBe("en");
  expect(req.fingerprint?.origin).toBe("o");
  expect(req.fingerprint?.referer).toBe("r");
});
