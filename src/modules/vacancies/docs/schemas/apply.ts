import type { OpenAPIV3 } from "openapi-types";

export const applySchemas: Record<string, OpenAPIV3.SchemaObject> = {
  ApplyVacancyRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      file: {
        type: "string",
        format: "binary",
        description: "Candidate CV file. Form field name must be `file`.",
      },
      coverLetter: {
        type: "string",
        maxLength: 5000,
        nullable: true,
        description: "Optional cover letter (max 5000 characters).",
      },
    },
    required: ["file"],
  },

  CandidatePublic: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: "string", format: "uuid" },
      email: { type: "string", format: "email" },
      firstName: { type: "string" },
      lastName: { type: "string" },
      language: { type: "string", enum: ["hy", "ru", "en"] },
    },
    required: ["id", "email", "firstName", "lastName", "language"],
  },

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

  ApplicationWithCandidate: {
    allOf: [
      { $ref: "#/components/schemas/Application" },
      {
        type: "object",
        additionalProperties: false,
        properties: {
          candidate: { $ref: "#/components/schemas/CandidatePublic" },
        },
        required: ["candidate"],
      },
    ],
  },

  ApplyVacancyResponse: {
    type: "object",
    additionalProperties: false,
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        additionalProperties: false,
        properties: {
          application: { $ref: "#/components/schemas/Application" },
        },
        required: ["application"],
      },
    },
    required: ["success", "data"],
  },
};
