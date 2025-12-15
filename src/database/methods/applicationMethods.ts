import { Application } from "../models/Application";
import type { ApplicationStatus } from "../../domain/types";
import type { DbOptions } from "./types";

export interface ApplicationEntity {
  id: string;
  vacancyId: string;
  candidateId: string;
  cvFilePath: string;
  coverLetter: string | null;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApplicationDTO {
  vacancyId: string;
  candidateId: string;
  cvFilePath: string;
  coverLetter?: string | null;
  status?: ApplicationStatus;
}

export interface UpdateApplicationDTO {
  status?: ApplicationStatus;
  coverLetter?: string | null;
}

function mapApplicationModelToEntity(model: Application): ApplicationEntity {
  return {
    id: model.id,
    vacancyId: model.vacancyId,
    candidateId: model.candidateId,
    cvFilePath: model.cvFilePath,
    coverLetter: model.coverLetter,
    status: model.status,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

export async function createApplication(
  payload: CreateApplicationDTO,
  options?: DbOptions,
): Promise<ApplicationEntity> {
  const application = await Application.create(
    {
      vacancyId: payload.vacancyId,
      candidateId: payload.candidateId,
      cvFilePath: payload.cvFilePath,
      coverLetter: payload.coverLetter ?? null,
      status: payload.status ?? "applied",
    },
    { transaction: options?.transaction },
  );

  return mapApplicationModelToEntity(application);
}

export async function getApplicationById(id: string): Promise<ApplicationEntity | null> {
  const application = await Application.findByPk(id);
  return application ? mapApplicationModelToEntity(application) : null;
}

export async function listApplicationsByVacancy(vacancyId: string): Promise<ApplicationEntity[]> {
  const applications = await Application.findAll({
    where: { vacancyId },
    order: [["createdAt", "DESC"]],
  });

  return applications.map(mapApplicationModelToEntity);
}

export async function listApplicationsByCandidate(
  candidateId: string,
): Promise<ApplicationEntity[]> {
  const applications = await Application.findAll({
    where: { candidateId },
    order: [["createdAt", "DESC"]],
  });

  return applications.map(mapApplicationModelToEntity);
}

export async function updateApplicationById(
  id: string,
  changes: UpdateApplicationDTO,
  options?: DbOptions,
): Promise<ApplicationEntity | null> {
  const application = await Application.findByPk(id);

  if (!application) {
    return null;
  }

  application.set({
    ...(changes.status !== undefined ? { status: changes.status } : {}),
    ...(changes.coverLetter !== undefined ? { coverLetter: changes.coverLetter } : {}),
  });

  await application.save({ transaction: options?.transaction });

  return mapApplicationModelToEntity(application);
}

export async function deleteApplicationById(id: string, options?: DbOptions): Promise<boolean> {
  const deletedCount = await Application.destroy({
    where: { id },
    transaction: options?.transaction,
  });

  return deletedCount > 0;
}
