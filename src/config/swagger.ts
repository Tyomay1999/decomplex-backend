import type { OpenAPIV3 } from "openapi-types";

import { commonSchemas } from "../docs/schemas";
import { commonResponses } from "../docs/responses";

import { authPaths, authSchemas } from "../modules/auth/docs";
import { vacanciesPaths, vacanciesSchemas } from "../modules/vacancies/docs";
import { applicationsPaths, applicationsSchemas } from "../modules/applications/docs";

function mergePaths(...items: OpenAPIV3.PathsObject[]): OpenAPIV3.PathsObject {
  return items.reduce<OpenAPIV3.PathsObject>((acc, cur) => ({ ...acc, ...cur }), {});
}

function mergeSchemas(
  ...items: Array<Record<string, OpenAPIV3.SchemaObject>>
): Record<string, OpenAPIV3.SchemaObject> {
  return items.reduce<Record<string, OpenAPIV3.SchemaObject>>(
    (acc, cur) => ({ ...acc, ...cur }),
    {},
  );
}

export const swaggerSpec: OpenAPIV3.Document = {
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
  tags: [{ name: "Auth" }, { name: "Vacancies" }, { name: "Applications" }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: mergeSchemas(commonSchemas, authSchemas, vacanciesSchemas, applicationsSchemas),
    responses: commonResponses,
  },
  paths: mergePaths(authPaths, vacanciesPaths, applicationsPaths),
};
