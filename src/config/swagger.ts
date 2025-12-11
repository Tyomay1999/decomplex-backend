import swaggerJsdoc, { Options } from "swagger-jsdoc";

const swaggerDefinition: Options["definition"] = {
  openapi: "3.0.0",
  info: {
    title: "Decomplex Event Management Platform API",
    version: "1.0.0",
    description: "Backend API for Decomplex Event Management Platform. Documented with OpenAPI 3.",
  },
  servers: [
    {
      url: "/api",
      description: "API base path",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          firstName: { type: "string", nullable: true },
          lastName: { type: "string", nullable: true },
          role: {
            type: "string",
            enum: ["platform_admin", "company_owner", "company_admin", "company_member"],
          },
          status: {
            type: "string",
            enum: ["active", "pending", "blocked"],
          },
          lastLoginAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "email", "role", "status", "createdAt", "updatedAt"],
      },

      Company: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          slug: { type: "string" },
          status: {
            type: "string",
            enum: ["active", "blocked"],
          },
          ownerUserId: { type: "string", format: "uuid", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "name", "slug", "status", "createdAt", "updatedAt"],
      },

      ErrorResponse: {
        type: "object",
        properties: {
          statusCode: { type: "integer" },
          message: { type: "string" },
          requestId: { type: "string" },
        },
        required: ["statusCode", "message", "requestId"],
      },
    },
  },
  paths: {},
};

const swaggerOptions: Options = {
  definition: swaggerDefinition,
  apis: ["./src/routes/**/*.ts", "./src/docs/**/*.yaml"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
