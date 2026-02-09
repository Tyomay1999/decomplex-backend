import type { OpenAPIV3 } from "openapi-types";

export const createVacancyPostPath: OpenAPIV3.PathsObject = {
  "/vacancies": {
    post: {
      tags: ["Vacancies"],
      summary: "Create vacancy",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateVacancyRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateVacancyResponse" },
            },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
};
