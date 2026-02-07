import { createHttpClient } from "../helpers/http";
import { e2eEnv } from "../helpers/env";
import type { ApiResponse } from "../helpers/types";

type ErrorShape = {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

const makeHeaders = (fingerprint: string): Record<string, string> => ({
  "x-client-fingerprint": fingerprint,
  "accept-language": "en",
});

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

const assertErrorContract = (body: unknown): ErrorShape => {
  if (!isObject(body)) {
    throw new Error("Expected error body to be an object");
  }

  const success = body["success"];
  if (success !== false) {
    throw new Error("Expected success=false on error responses");
  }

  const err = body["error"];
  if (!isObject(err)) {
    throw new Error("Expected error object on error responses");
  }

  const code = err["code"];
  const message = err["message"];

  if (typeof code !== "string" || code.trim().length === 0) {
    throw new Error("Expected error.code to be a non-empty string");
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    throw new Error("Expected error.message to be a non-empty string");
  }

  return {
    success: false,
    error: {
      code,
      message,
      details: err["details"],
    },
  };
};

describe("E2E Error Contract", () => {
  const { baseUrl, fingerprint } = e2eEnv();
  const http = createHttpClient(baseUrl);
  const headers = makeHeaders(fingerprint);

  test("404 responses must follow the unified error contract", async () => {
    const res = await http.get<ApiResponse<Record<string, never>>>(
      "/api/this-route-does-not-exist",
      { headers },
    );
    expect(res.status).toBe(404);
    assertErrorContract(res.body);
  });

  test("422 validation errors must follow the unified error contract", async () => {
    const res = await http.post<ApiResponse<Record<string, never>>, { email: string }>(
      "/api/auth/login",
      { email: "not-an-email" },
      { headers },
    );

    expect(res.status).toBe(422);
    const err = assertErrorContract(res.body);
    expect(err.error.code).toBe("VALIDATION_FAILED");
  });

  test("401 unauthorized errors must follow the unified error contract", async () => {
    const res = await http.get<ApiResponse<Record<string, never>>>("/api/auth/me", {
      headers: { ...headers, authorization: "Bearer invalid-token" },
    });

    expect(res.status).toBe(401);
    assertErrorContract(res.body);
  });
});
