import type { OpenAPIV3 } from "openapi-types";

export const currentGetPath: OpenAPIV3.PathsObject = {
  "/auth/current": {
    get: {
      tags: ["Auth"],
      summary: "Get current user",
      security: [{ BearerAuth: [] }],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CurrentUserResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
};
