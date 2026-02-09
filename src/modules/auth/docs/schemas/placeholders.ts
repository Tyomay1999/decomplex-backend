import type { OpenAPIV3 } from "openapi-types";

export const placeholderSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  CurrentUserResponse: {
    type: "object",
    additionalProperties: false,
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        additionalProperties: false,
        properties: {
          user: {
            description: "Populated by auth middleware. Shape depends on req.user contract.",
            nullable: true,
            oneOf: [
              { $ref: "#/components/schemas/ReqUserCandidate" },
              { $ref: "#/components/schemas/ReqUserCompany" },
            ],
          },
        },
        required: ["user"],
      },
    },
    required: ["success", "data"],
  },

  MeResponse: {
    type: "object",
    additionalProperties: false,
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        oneOf: [
          { $ref: "#/components/schemas/MeCandidateData" },
          { $ref: "#/components/schemas/MeCompanyData" },
        ],
        discriminator: {
          propertyName: "userType",
          mapping: {
            candidate: "#/components/schemas/MeCandidateData",
            company: "#/components/schemas/MeCompanyData",
          },
        },
      },
    },
    required: ["success", "data"],
  },

  ReqUserCandidate: {
    type: "object",
    additionalProperties: false,
    properties: {
      userType: { type: "string", enum: ["candidate"] },
      id: { type: "string", format: "uuid" },
      email: { type: "string", format: "email" },
      role: { type: "string", enum: ["candidate"] },
      language: { type: "string" },
      fingerprint: { type: "string", nullable: true },
    },
    required: ["userType", "id", "email", "role", "language"],
  },

  ReqUserCompany: {
    type: "object",
    additionalProperties: false,
    properties: {
      userType: { type: "string", enum: ["company"] },
      id: { type: "string", format: "uuid" },
      companyId: { type: "string", format: "uuid" },
      email: { type: "string", format: "email" },
      role: { type: "string" },
      language: { type: "string" },
      position: { type: "string", nullable: true },
      fingerprint: { type: "string", nullable: true },
    },
    required: ["userType", "id", "companyId", "email", "role", "language"],
  },

  MeCandidateData: {
    type: "object",
    additionalProperties: false,
    properties: {
      userType: { type: "string", enum: ["candidate"] },
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

  MeCompanyData: {
    type: "object",
    additionalProperties: false,
    properties: {
      userType: { type: "string", enum: ["company"] },
      user: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          role: { type: "string" },
          language: { type: "string" },
          position: { type: "string", nullable: true },
          companyId: { type: "string", format: "uuid" },
        },
        required: ["id", "email", "role", "language", "companyId"],
      },
      company: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          defaultLocale: { type: "string" },
          status: { type: "string" },
        },
        required: ["id", "name", "defaultLocale", "status"],
      },
    },
    required: ["userType", "user", "company"],
  },

  RegisterCompanyRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 2, maxLength: 255 },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
      defaultLocale: { type: "string", enum: ["hy", "ru", "en"], nullable: true },
      adminLanguage: { type: "string", enum: ["hy", "ru", "en"], nullable: true },
      fingerprint: { type: "string", nullable: true },
    },
    required: ["name", "email", "password"],
  },

  RegisterCompanyResponse: {
    type: "object",
    additionalProperties: false,
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        additionalProperties: false,
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
          user: {
            type: "object",
            additionalProperties: false,
            properties: {
              id: { type: "string", format: "uuid" },
              email: { type: "string", format: "email" },
              role: { type: "string", enum: ["admin"] },
              language: { type: "string", enum: ["hy", "ru", "en"] },
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
              email: { type: "string", format: "email" },
              defaultLocale: { type: "string", enum: ["hy", "ru", "en"] },
              status: { type: "string", enum: ["active"] },
            },
            required: ["id", "name", "email", "defaultLocale", "status"],
          },
        },
        required: ["accessToken", "refreshToken", "user", "company"],
      },
    },
    required: ["success", "data"],
  },

  RegisterCandidateRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
      firstName: { type: "string", minLength: 1, maxLength: 100 },
      lastName: { type: "string", minLength: 1, maxLength: 100 },
      language: { type: "string", enum: ["hy", "ru", "en"] },
      fingerprint: { type: "string", nullable: true },
      rememberUser: { type: "boolean", default: false },
    },
    required: ["email", "password", "firstName", "lastName", "language"],
  },

  RegisterCandidateResponse: {
    type: "object",
    additionalProperties: false,
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        allOf: [
          { $ref: "#/components/schemas/Tokens" },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              fingerprintHash: { type: "string", nullable: true },
              userType: { type: "string", enum: ["candidate"] },
              user: {
                type: "object",
                additionalProperties: false,
                properties: {
                  id: { type: "string", format: "uuid" },
                  email: { type: "string", format: "email" },
                  role: { type: "string", enum: ["candidate"] },
                  language: { type: "string", enum: ["hy", "ru", "en"] },
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
    },
    required: ["success", "data"],
  },

  RegisterCompanyUserRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
      role: { type: "string", enum: ["admin", "recruiter"] },
      position: { type: "string", minLength: 1, maxLength: 255, nullable: true },
      language: { type: "string", enum: ["hy", "ru", "en"] },
      fingerprint: { type: "string", nullable: true },
    },
    required: ["email", "password", "role", "language"],
  },

  RegisterCompanyUserResponse: {
    type: "object",
    additionalProperties: false,
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["admin", "recruiter"] },
          position: { type: "string", nullable: true },
          language: { type: "string", enum: ["hy", "ru", "en"] },
          companyId: { type: "string", format: "uuid" },
        },
        required: ["id", "email", "role", "language", "companyId"],
      },
    },
    required: ["success", "data"],
  },

  LogoutRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      refreshToken: { type: "string" },
    },
  },

  LogoutResponse: {
    type: "object",
    additionalProperties: false,
    properties: {
      success: { type: "boolean", enum: [true] },
      message: { type: "string" },
    },
    required: ["success", "message"],
  },
};
