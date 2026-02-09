import type { OpenAPIV3 } from "openapi-types";

export const listMyApplicationsGetPath: OpenAPIV3.PathsObject = {
  "/applications/my": {
    get: {
      tags: ["Applications"],
      summary: "List my applications (cursor pagination)",
      security: [{ BearerAuth: [] }],
      parameters: [
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
      ],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MyApplicationsListResponse" },
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
