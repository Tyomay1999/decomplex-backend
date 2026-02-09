import type { OpenAPIV3 } from "openapi-types";

export const logoutPatchPath: OpenAPIV3.PathsObject = {
  "/auth/logout": {
    patch: {
      tags: ["Auth"],
      summary: "Logout",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LogoutRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LogoutResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
};
