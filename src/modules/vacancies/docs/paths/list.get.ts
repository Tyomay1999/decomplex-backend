import type { OpenAPIV3 } from "openapi-types";

export const listVacanciesGetPath: OpenAPIV3.PathsObject = {
  "/vacancies": {
    get: {
      tags: ["Vacancies"],
      summary: "List vacancies (cursor pagination)",
      security: [],
      parameters: [
        {
          in: "query",
          name: "companyId",
          required: false,
          schema: { type: "string", format: "uuid" },
        },
        {
          in: "query",
          name: "status",
          required: false,
          schema: { type: "string", enum: ["active", "archived"] },
        },
        {
          in: "query",
          name: "jobType",
          required: false,
          schema: { type: "string", enum: ["full_time", "part_time", "remote", "hybrid"] },
        },
        {
          in: "query",
          name: "q",
          required: false,
          schema: { type: "string" },
          description: "Search in title/description/location (ILIKE).",
        },
        {
          in: "query",
          name: "limit",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
          description: "Max 50. If invalid, defaults to 20.",
        },
        {
          in: "query",
          name: "cursor",
          required: false,
          schema: { type: "string" },
          description: "Opaque base64 cursor returned as nextCursor.",
        },
      ],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VacancyListResponse" },
            },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
};
