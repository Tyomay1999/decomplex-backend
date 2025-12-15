import { Candidate } from "../models/Candidate";
import type { LocaleCode } from "../../domain/types";
import type { DbOptions } from "./types";

export interface CandidateEntity {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  language: LocaleCode;
  createdAt: Date;
  updatedAt: Date;
}

export interface CandidateAuthEntity {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  language: LocaleCode;
}

export interface CreateCandidateDTO {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  language?: LocaleCode;
}

export interface UpdateCandidateDTO {
  firstName?: string;
  lastName?: string;
  language?: LocaleCode;
}

function mapCandidateModelToEntity(model: Candidate): CandidateEntity {
  return {
    id: model.id,
    email: model.email,
    firstName: model.firstName,
    lastName: model.lastName,
    language: model.language,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

function mapCandidateModelToAuthEntity(model: Candidate): CandidateAuthEntity {
  return {
    id: model.id,
    email: model.email,
    passwordHash: model.passwordHash,
    firstName: model.firstName,
    lastName: model.lastName,
    language: model.language,
  };
}

export async function createCandidate(
  payload: CreateCandidateDTO,
  options?: DbOptions,
): Promise<CandidateEntity> {
  const candidate = await Candidate.create(
    {
      email: payload.email,
      passwordHash: payload.passwordHash,
      firstName: payload.firstName,
      lastName: payload.lastName,
      language: payload.language ?? "en",
    },
    { transaction: options?.transaction },
  );

  return mapCandidateModelToEntity(candidate);
}

export async function getCandidateById(id: string): Promise<CandidateEntity | null> {
  const candidate = await Candidate.findByPk(id);
  return candidate ? mapCandidateModelToEntity(candidate) : null;
}

export async function getCandidateByEmail(email: string): Promise<CandidateEntity | null> {
  const candidate = await Candidate.findOne({ where: { email } });
  return candidate ? mapCandidateModelToEntity(candidate) : null;
}

export async function getCandidateAuthByEmail(email: string): Promise<CandidateAuthEntity | null> {
  const candidate = await Candidate.findOne({ where: { email } });
  return candidate ? mapCandidateModelToAuthEntity(candidate) : null;
}

export async function updateCandidateById(
  id: string,
  changes: UpdateCandidateDTO,
  options?: DbOptions,
): Promise<CandidateEntity | null> {
  const candidate = await Candidate.findByPk(id);

  if (!candidate) {
    return null;
  }

  candidate.set({
    ...(changes.firstName !== undefined ? { firstName: changes.firstName } : {}),
    ...(changes.lastName !== undefined ? { lastName: changes.lastName } : {}),
    ...(changes.language !== undefined ? { language: changes.language } : {}),
  });

  await candidate.save({ transaction: options?.transaction });

  return mapCandidateModelToEntity(candidate);
}

export async function deleteCandidateById(id: string, options?: DbOptions): Promise<boolean> {
  const deletedCount = await Candidate.destroy({
    where: { id },
    transaction: options?.transaction,
  });

  return deletedCount > 0;
}
