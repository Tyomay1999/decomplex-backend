import type { Request, Response, NextFunction } from "express";
import { errorHandler } from "../../src/middleware/errorHandler";
import { AppError } from "../../src/errors/AppError";
import { DomainError } from "../../src/errors/DomainError";

type JsonPrimitive = null | boolean | number | string;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [k: string]: JsonValue };

type RequestWithId = Request & { requestId?: string };

type MockResState = {
  statusCode: number;
  payload?: JsonValue;
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const createMockReq = (requestId?: string): RequestWithId => {
  const req = { headers: {} } as unknown as RequestWithId;
  if (requestId) req.requestId = requestId;
  return req;
};

const createMockRes = (): { res: Response; state: MockResState } => {
  const state: MockResState = { statusCode: 200 };

  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(payload: JsonValue) {
      state.payload = payload;
      return res;
    },
  } as unknown as Response;

  return { res, state };
};

const next: NextFunction = () => undefined;

describe("global errorHandler middleware", () => {
  it("DomainError -> statusCode + { error: { code, message, details } }", () => {
    const req = createMockReq("r-1");
    const { res, state } = createMockRes();

    const err = new DomainError({
      code: "VALIDATION_FAILED",
      message: "Validation failed",
      statusCode: 422,
      details: { field: "email" },
    });

    errorHandler(err, req, res, next);

    expect(state.statusCode).toBe(422);

    expect(isObject(state.payload)).toBe(true);
    if (!isObject(state.payload)) throw new Error("payload is not object");

    expect("error" in state.payload).toBe(true);
    const e = (state.payload as Record<string, unknown>).error;

    expect(isObject(e)).toBe(true);
    if (!isObject(e)) throw new Error("error is not object");

    expect(e.code).toBe("VALIDATION_FAILED");
    expect(e.message).toBe("Validation failed");
    expect(e.details).toEqual({ field: "email" });
  });

  it("AppError -> statusCode + { success:false, message, code, requestId }", () => {
    const req = createMockReq("r-2");
    const { res, state } = createMockRes();

    const err = new AppError("Boom", { statusCode: 418, code: "TEAPOT", isOperational: true });

    errorHandler(err, req, res, next);

    expect(state.statusCode).toBe(418);

    expect(isObject(state.payload)).toBe(true);
    if (!isObject(state.payload)) throw new Error("payload is not object");

    const p = state.payload as Record<string, unknown>;

    expect(p.success).toBe(false);
    expect(p.message).toBe("Boom");
    expect(p.code).toBe("TEAPOT");
    expect(p.requestId).toBe("r-2");
  });

  it("unknown Error -> 500 + safe body shape", () => {
    const req = createMockReq("r-3");
    const { res, state } = createMockRes();

    const err = new Error("secret");

    errorHandler(err, req, res, next);

    expect(state.statusCode).toBe(500);

    expect(isObject(state.payload)).toBe(true);
    if (!isObject(state.payload)) throw new Error("payload is not object");

    const p = state.payload as Record<string, unknown>;

    expect(p.success).toBe(false);
    expect(typeof p.message).toBe("string");
    expect(p.code).toBe("INTERNAL_ERROR");
    expect(p.requestId).toBe("r-3");
  });
});
