import type { OpenAPIV3 } from "openapi-types";

export const vacancySchemas: Record<string, OpenAPIV3.SchemaObject> = {
  Vacancy: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: "string", format: "uuid" },
      companyId: { type: "string", format: "uuid" },
      createdById: { type: "string", format: "uuid", nullable: true },

      title: { type: "string", maxLength: 255 },
      description: { type: "string" },

      salaryFrom: { type: "integer", minimum: 0, nullable: true },
      salaryTo: { type: "integer", minimum: 0, nullable: true },

      jobType: { type: "string", enum: ["full_time", "part_time", "remote", "hybrid"] },
      location: { type: "string", maxLength: 255, nullable: true },

      status: { type: "string", enum: ["active", "archived"] },

      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "companyId",
      "createdById",
      "title",
      "description",
      "salaryFrom",
      "salaryTo",
      "jobType",
      "location",
      "status",
      "createdAt",
      "updatedAt",
    ],
  },

  VacancyWithHasApplied: {
    allOf: [
      { $ref: "#/components/schemas/Vacancy" },
      {
        type: "object",
        additionalProperties: false,
        properties: {
          hasApplied: { type: "boolean" },
        },
        required: ["hasApplied"],
      },
    ],
    description: "Vacancy with viewer-specific flag (hasApplied).",
  },

  VacancyListResponse: {
    type: "object",
    additionalProperties: false,
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        additionalProperties: false,
        properties: {
          vacancies: {
            type: "array",
            items: { $ref: "#/components/schemas/Vacancy" },
          },
          nextCursor: { type: "string", nullable: true },
        },
        required: ["vacancies", "nextCursor"],
      },
    },
    required: ["success", "data"],
  },

  VacancyGetByIdResponse: {
    type: "object",
    additionalProperties: false,
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        additionalProperties: false,
        properties: {
          vacancy: {
            oneOf: [
              { $ref: "#/components/schemas/Vacancy" },
              { $ref: "#/components/schemas/VacancyWithHasApplied" },
            ],
          },
        },
        required: ["vacancy"],
      },
    },
    required: ["success", "data"],
  },

  CreateVacancyRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 3, maxLength: 255 },
      description: { type: "string", minLength: 10 },
      salaryFrom: { type: "integer", minimum: 0, nullable: true },
      salaryTo: { type: "integer", minimum: 0, nullable: true },
      jobType: { type: "string", enum: ["full_time", "part_time", "remote", "hybrid"] },
      location: { type: "string", maxLength: 255, nullable: true },
    },
    required: ["title", "description", "jobType"],
    description: "If both salaryFrom and salaryTo are provided, salaryFrom must be <= salaryTo.",
  },

  CreateVacancyResponse: {
    type: "object",
    additionalProperties: false,
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        additionalProperties: false,
        properties: {
          vacancy: { $ref: "#/components/schemas/Vacancy" },
        },
        required: ["vacancy"],
      },
    },
    required: ["success", "data"],
  },

  UpdateVacancyRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 3, maxLength: 255 },
      description: { type: "string", minLength: 10 },
      salaryFrom: { type: "integer", minimum: 0, nullable: true },
      salaryTo: { type: "integer", minimum: 0, nullable: true },
      jobType: { type: "string", enum: ["full_time", "part_time", "remote", "hybrid"] },
      location: { type: "string", maxLength: 255, nullable: true },
      status: { type: "string", enum: ["active", "archived"] },
    },
    required: [],
    description:
      "All fields are optional. If both salaryFrom and salaryTo are provided, salaryFrom must be <= salaryTo.",
  },

  UpdateVacancyResponse: {
    type: "object",
    additionalProperties: false,
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        additionalProperties: false,
        properties: {
          vacancy: { $ref: "#/components/schemas/Vacancy" },
        },
        required: ["vacancy"],
      },
    },
    required: ["success", "data"],
  },

  ArchiveVacancyResponse: {
    type: "object",
    additionalProperties: false,
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        additionalProperties: false,
        properties: {
          vacancy: { $ref: "#/components/schemas/Vacancy" },
        },
        required: ["vacancy"],
      },
    },
    required: ["success", "data"],
  },

  VacancyApplicationsListResponse: {
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
            items: { $ref: "#/components/schemas/ApplicationWithCandidate" },
          },
          nextCursor: { type: "string", nullable: true },
        },
        required: ["items", "nextCursor"],
      },
    },
    required: ["success", "data"],
  },
};
