import type { OpenAPIV3 } from "openapi-types";

export const loginSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  LoginRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      companyId: { type: "string", format: "uuid", nullable: true },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
      fingerprint: { type: "string", nullable: true, description: "May be empty string" },
      rememberUser: { type: "boolean", default: false },
    },
    required: ["email", "password"],
  },

  LoginResponse: {
    type: "object",
    additionalProperties: false,
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        oneOf: [
          { $ref: "#/components/schemas/LoginCompanyData" },
          { $ref: "#/components/schemas/LoginCandidateData" },
        ],
        discriminator: {
          propertyName: "userType",
          mapping: {
            company: "#/components/schemas/LoginCompanyData",
            candidate: "#/components/schemas/LoginCandidateData",
          },
        },
      },
    },
    required: ["success", "data"],
  },

  LoginCompanyData: {
    allOf: [
      { $ref: "#/components/schemas/Tokens" },
      {
        type: "object",
        additionalProperties: false,
        properties: {
          userType: { type: "string", enum: ["company"] },
          fingerprintHash: { type: "string", nullable: true },
          user: {
            type: "object",
            additionalProperties: false,
            properties: {
              id: { type: "string", format: "uuid" },
              email: { type: "string", format: "email" },
              role: { type: "string" },
              language: { type: "string" },
              position: { type: "string", nullable: true },
            },
            required: ["id", "email", "role", "language"],
          },
          company: {
            type: "object",
            additionalProperties: false,
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              defaultLocale: { type: "string", nullable: true },
              status: { type: "string" },
            },
            required: ["id", "name", "status"],
          },
        },
        required: ["userType", "user", "company"],
      },
    ],
  },

  LoginCandidateData: {
    allOf: [
      { $ref: "#/components/schemas/Tokens" },
      {
        type: "object",
        additionalProperties: false,
        properties: {
          userType: { type: "string", enum: ["candidate"] },
          fingerprintHash: { type: "string", nullable: true },
          user: {
            type: "object",
            additionalProperties: false,
            properties: {
              id: { type: "string", format: "uuid" },
              email: { type: "string", format: "email" },
              role: { type: "string", enum: ["candidate"] },
              language: { type: "string" },
              firstName: { type: "string", nullable: true },
              lastName: { type: "string", nullable: true },
            },
            required: ["id", "email", "role", "language"],
          },
        },
        required: ["userType", "user"],
      },
    ],
  },
};
