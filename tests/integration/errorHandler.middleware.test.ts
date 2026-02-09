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

function pickError(payload: JsonValue | undefined): Record<string, unknown> {
  if (!isObject(payload)) throw new Error("payload is not object");
  const p = payload as Record<string, unknown>;

  if (!("success" in p)) throw new Error("missing success");
  if (p.success !== false) throw new Error("success is not false");

  if (!("error" in p)) throw new Error("missing error");
  const e = p.error;

  if (!isObject(e)) throw new Error("error is not object");
  return e;
}

describe("global errorHandler middleware", () => {
  it("DomainError -> statusCode + { success:false, error: { code, message, details } }", () => {
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

    const e = pickError(state.payload);

    expect(e.code).toBe("VALIDATION_FAILED");
    expect(e.message).toBe("Validation failed");
    expect(e.details).toEqual({ field: "email" });
  });

  it("AppError -> statusCode + { success:false, error: { code, message } }", () => {
    const req = createMockReq("r-2");
    const { res, state } = createMockRes();

    const err = new AppError("Boom", { statusCode: 418, code: "TEAPOT", isOperational: true });

    errorHandler(err, req, res, next);

    expect(state.statusCode).toBe(418);

    const e = pickError(state.payload);

    expect(e.code).toBe("TEAPOT");
    expect(e.message).toBe("Boom");
  });

  it("unknown Error -> 500 + { success:false, error: { code, message } }", () => {
    const req = createMockReq("r-3");
    const { res, state } = createMockRes();

    const err = new Error("secret");

    errorHandler(err, req, res, next);

    expect(state.statusCode).toBe(500);

    const e = pickError(state.payload);

    expect(e.code).toBe("INTERNAL_ERROR");
    expect(e.message).toBe("Internal server error");
  });
});
