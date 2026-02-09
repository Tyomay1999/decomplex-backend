import type { OpenAPIV3 } from "openapi-types";

export const registerCompanyUserPostPath: OpenAPIV3.PathsObject = {
  "/auth/register/company-user": {
    post: {
      tags: ["Auth"],
      summary: "Register company user",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RegisterCompanyUserRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterCompanyUserResponse" },
            },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "409": { $ref: "#/components/responses/Conflict" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
};
