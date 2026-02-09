import type { OpenAPIV3 } from "openapi-types";

export const meGetPath: OpenAPIV3.PathsObject = {
  "/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "Get me",
      security: [{ BearerAuth: [] }],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MeResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
};
