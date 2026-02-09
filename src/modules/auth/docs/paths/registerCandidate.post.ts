import type { OpenAPIV3 } from "openapi-types";

export const registerCandidatePostPath: OpenAPIV3.PathsObject = {
  "/auth/register/candidate": {
    post: {
      tags: ["Auth"],
      summary: "Register candidate",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RegisterCandidateRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterCandidateResponse" },
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
