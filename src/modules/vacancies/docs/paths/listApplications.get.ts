import type { OpenAPIV3 } from "openapi-types";

export const listVacancyApplicationsGetPath: OpenAPIV3.PathsObject = {
  "/vacancies/{id}/applications": {
    get: {
      tags: ["Vacancies"],
      summary: "List applications for a vacancy (cursor pagination)",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
        {
          in: "query",
          name: "limit",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
          description: "If invalid, defaults to 20. Server clamps to max 50 in DB layer.",
        },
        {
          in: "query",
          name: "cursor",
          required: false,
          schema: { type: "string" },
          description: "Opaque base64 cursor returned as nextCursor.",
        },
        {
          in: "query",
          name: "status",
          required: false,
          schema: {
            type: "string",
            enum: ["applied", "viewed", "interview", "rejected", "accepted"],
          },
        },
        {
          in: "query",
          name: "q",
          required: false,
          schema: { type: "string" },
          description: "Search in candidate firstName/lastName/email (ILIKE).",
        },
      ],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VacancyApplicationsListResponse" },
            },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
};
