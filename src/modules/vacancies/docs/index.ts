import type { OpenAPIV3 } from "openapi-types";

import { listVacanciesGetPath } from "./paths/list.get";
import { getVacancyByIdGetPath } from "./paths/getById.get";
import { createVacancyPostPath } from "./paths/create.post";
import { updateVacancyPatchPath } from "./paths/update.patch";
import { archiveVacancyDeletePath } from "./paths/archive.delete";
import { applyVacancyPostPath } from "./paths/apply.post";
import { listVacancyApplicationsGetPath } from "./paths/listApplications.get";

import { vacancySchemas } from "./schemas/vacancy";
import { applySchemas } from "./schemas/apply";
import { vacancyPlaceholderSchemas } from "./schemas/placeholders";

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

export const vacanciesPaths: OpenAPIV3.PathsObject = mergePaths(
  listVacanciesGetPath,
  getVacancyByIdGetPath,
  createVacancyPostPath,
  listVacancyApplicationsGetPath,
  applyVacancyPostPath,
  updateVacancyPatchPath,
  archiveVacancyDeletePath,
);

export const vacanciesSchemas: Record<string, OpenAPIV3.SchemaObject> = mergeSchemas(
  vacancySchemas,
  applySchemas,
  vacancyPlaceholderSchemas,
);
