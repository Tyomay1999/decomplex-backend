import type { OpenAPIV3 } from "openapi-types";

export const archiveVacancyDeletePath: OpenAPIV3.PathsObject = {
  "/vacancies/{id}": {
    delete: {
      tags: ["Vacancies"],
      summary: "Archive vacancy",
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
              schema: { $ref: "#/components/schemas/ArchiveVacancyResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
};
