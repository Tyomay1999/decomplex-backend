import type { OpenAPIV3 } from "openapi-types";

export const getVacancyByIdGetPath: OpenAPIV3.PathsObject = {
  "/vacancies/{id}": {
    get: {
      tags: ["Vacancies"],
      summary: "Get vacancy by id",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VacancyGetByIdResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
};
