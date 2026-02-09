import type { OpenAPIV3 } from "openapi-types";

export const applicationSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  Application: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: "string", format: "uuid" },
      vacancyId: { type: "string", format: "uuid" },
      candidateId: { type: "string", format: "uuid" },
      cvFilePath: { type: "string", maxLength: 512 },
      coverLetter: { type: "string", nullable: true },
      status: { type: "string", enum: ["applied", "viewed", "interview", "rejected", "accepted"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "vacancyId", "candidateId", "cvFilePath", "status", "createdAt", "updatedAt"],
  },

  MyApplicationsListResponse: {
    type: "object",
    additionalProperties: false,
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        additionalProperties: false,
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/Application" },
          },
          nextCursor: { type: "string", nullable: true },
        },
        required: ["items", "nextCursor"],
      },
    },
    required: ["success", "data"],
  },
};
