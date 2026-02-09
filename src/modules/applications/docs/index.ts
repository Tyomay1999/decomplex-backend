import type { OpenAPIV3 } from "openapi-types";

import { listMyApplicationsGetPath } from "./paths/listMy.get";
import { applicationSchemas } from "./schemas/applications";

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

export const applicationsPaths: OpenAPIV3.PathsObject = mergePaths(listMyApplicationsGetPath);

export const applicationsSchemas: Record<string, OpenAPIV3.SchemaObject> =
  mergeSchemas(applicationSchemas);
