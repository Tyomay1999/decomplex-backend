import type { OpenAPIV3 } from "openapi-types";

export const registerCompanyPostPath: OpenAPIV3.PathsObject = {
  "/auth/register/company": {
    post: {
      tags: ["Auth"],
      summary: "Register company",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RegisterCompanyRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterCompanyResponse" },
            },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "409": { $ref: "#/components/responses/Conflict" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
};
