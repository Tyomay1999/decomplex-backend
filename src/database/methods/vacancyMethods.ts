import { Vacancy } from "../models/Vacancy";
import type { VacancyJobType, VacancyStatus } from "../../domain/types";
import type { DbOptions } from "./types";

export interface VacancyEntity {
  id: string;
  companyId: string;
  createdById: string | null;
  title: string;
  description: string;
  salaryFrom: number | null;
  salaryTo: number | null;
  jobType: VacancyJobType;
  location: string | null;
  status: VacancyStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVacancyDTO {
  companyId: string;
  createdById?: string | null;
  title: string;
  description: string;
  salaryFrom?: number | null;
  salaryTo?: number | null;
  jobType: VacancyJobType;
  location?: string | null;
  status?: VacancyStatus;
}

export interface UpdateVacancyDTO {
  title?: string;
  description?: string;
  salaryFrom?: number | null;
  salaryTo?: number | null;
  jobType?: VacancyJobType;
  location?: string | null;
  status?: VacancyStatus;
}

function mapVacancyModelToEntity(model: Vacancy): VacancyEntity {
  return {
    id: model.id,
    companyId: model.companyId,
    createdById: model.createdById,
    title: model.title,
    description: model.description,
    salaryFrom: model.salaryFrom,
    salaryTo: model.salaryTo,
    jobType: model.jobType,
    location: model.location,
    status: model.status,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

export async function createVacancy(
  payload: CreateVacancyDTO,
  options?: DbOptions,
): Promise<VacancyEntity> {
  const vacancy = await Vacancy.create(
    {
      companyId: payload.companyId,
      createdById: payload.createdById ?? null,
      title: payload.title,
      description: payload.description,
      salaryFrom: payload.salaryFrom ?? null,
      salaryTo: payload.salaryTo ?? null,
      jobType: payload.jobType,
      location: payload.location ?? null,
      status: payload.status ?? "active",
    },
    { transaction: options?.transaction },
  );

  return mapVacancyModelToEntity(vacancy);
}

export async function getVacancyById(id: string): Promise<VacancyEntity | null> {
  const vacancy = await Vacancy.findByPk(id);
  return vacancy ? mapVacancyModelToEntity(vacancy) : null;
}

export interface ListVacanciesFilter {
  companyId?: string;
  status?: VacancyStatus;
  jobType?: VacancyJobType;
}

export async function listVacancies(filter: ListVacanciesFilter): Promise<VacancyEntity[]> {
  const where: Record<string, unknown> = {};

  if (filter.companyId) {
    where.companyId = filter.companyId;
  }
  if (filter.status) {
    where.status = filter.status;
  }
  if (filter.jobType) {
    where.jobType = filter.jobType;
  }

  const vacancies = await Vacancy.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });

  return vacancies.map(mapVacancyModelToEntity);
}

export async function updateVacancyById(
  id: string,
  changes: UpdateVacancyDTO,
  options?: DbOptions,
): Promise<VacancyEntity | null> {
  const vacancy = await Vacancy.findByPk(id);

  if (!vacancy) {
    return null;
  }

  vacancy.set({
    ...(changes.title !== undefined ? { title: changes.title } : {}),
    ...(changes.description !== undefined ? { description: changes.description } : {}),
    ...(changes.salaryFrom !== undefined ? { salaryFrom: changes.salaryFrom } : {}),
    ...(changes.salaryTo !== undefined ? { salaryTo: changes.salaryTo } : {}),
    ...(changes.jobType !== undefined ? { jobType: changes.jobType } : {}),
    ...(changes.location !== undefined ? { location: changes.location } : {}),
    ...(changes.status !== undefined ? { status: changes.status } : {}),
  });

  await vacancy.save({ transaction: options?.transaction });

  return mapVacancyModelToEntity(vacancy);
}

export async function deleteVacancyById(id: string, options?: DbOptions): Promise<boolean> {
  const deletedCount = await Vacancy.destroy({
    where: { id },
    transaction: options?.transaction,
  });

  return deletedCount > 0;
}
