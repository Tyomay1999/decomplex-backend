import type { OpenAPIV3 } from "openapi-types";

import { loginPostPath } from "./paths/login.post";
import { refreshPostPath } from "./paths/refresh.post";
import { currentGetPath } from "./paths/current.get";
import { meGetPath } from "./paths/me.get";
import { registerCompanyPostPath } from "./paths/registerCompany.post";
import { registerCandidatePostPath } from "./paths/registerCandidate.post";
import { registerCompanyUserPostPath } from "./paths/registerCompanyUser.post";
import { logoutPatchPath } from "./paths/logout.patch";

import { tokensSchemas } from "./schemas/tokens";
import { loginSchemas } from "./schemas/login";
import { refreshSchemas } from "./schemas/refresh";
import { placeholderSchemas } from "./schemas/placeholders";

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

export const authPaths: OpenAPIV3.PathsObject = mergePaths(
  loginPostPath,
  refreshPostPath,
  currentGetPath,
  meGetPath,
  registerCompanyPostPath,
  registerCandidatePostPath,
  registerCompanyUserPostPath,
  logoutPatchPath,
);

export const authSchemas: Record<string, OpenAPIV3.SchemaObject> = mergeSchemas(
  tokensSchemas,
  loginSchemas,
  refreshSchemas,
  placeholderSchemas,
);
