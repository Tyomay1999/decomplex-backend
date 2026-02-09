import type { OpenAPIV3 } from "openapi-types";

export const commonSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  ErrorResponse: {
    type: "object",
    additionalProperties: false,
    properties: {
      success: { type: "boolean", enum: [false] },
      requestId: { type: "string" },
      error: {
        type: "object",
        additionalProperties: false,
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          details: {},
        },
        required: ["code", "message"],
      },
    },
    required: ["success", "requestId", "error"],
  },
};
