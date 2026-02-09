import type { OpenAPIV3 } from "openapi-types";

export const tokensSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  Tokens: {
    type: "object",
    additionalProperties: false,
    properties: {
      accessToken: { type: "string" },
      refreshToken: { type: "string" },
    },
    required: ["accessToken", "refreshToken"],
  },
};
