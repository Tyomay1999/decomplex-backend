import type { OpenAPIV3 } from "openapi-types";

export const refreshSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  RefreshRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      refreshToken: { type: "string" },
    },
    required: ["refreshToken"],
  },

  RefreshResponse: {
    type: "object",
    additionalProperties: false,
    properties: {
      success: { type: "boolean", enum: [true] },
      data: { $ref: "#/components/schemas/Tokens" },
    },
    required: ["success", "data"],
  },
};
