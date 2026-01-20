import { Op } from "sequelize";
import type { WhereOptions, IncludeOptions } from "sequelize";
import { Application } from "../models/Application";
import { Candidate } from "../models/Candidate";
import type { ApplicationStatus } from "../../domain/types";
import type { DbOptions } from "./types";
import { validationFailed } from "../../errors/DomainError";

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

export interface CandidatePublicEntity {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  language: string;
}

export interface ApplicationWithCandidateEntity extends ApplicationEntity {
  candidate: CandidatePublicEntity;
}

export interface ListMyApplicationsPagedFilter {
  candidateId: string;
  limit: number;
  cursor?: string;
}

export interface ListMyApplicationsPagedResult {
  items: ApplicationEntity[];
  nextCursor: string | null;
}

export interface ListApplicationsByVacancyPagedFilter {
  vacancyId: string;
  limit: number;
  cursor?: string;
  status?: ApplicationStatus;
  q?: string;
}

export interface ListApplicationsByVacancyPagedResult {
  items: ApplicationWithCandidateEntity[];
  nextCursor: string | null;
}

type CursorPayload = { createdAt: string; id: string };
type UnknownRecord = Record<string, unknown>;

type WhereWithAnd = WhereOptions & {
  [Op.and]?: WhereOptions | WhereOptions[];
};

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null;
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

function mapCandidateToPublicEntity(raw: unknown): CandidatePublicEntity {
  if (raw instanceof Candidate) {
    return {
      id: raw.id,
      email: raw.email,
      firstName: raw.firstName,
      lastName: raw.lastName,
      language: raw.language,
    };
  }

  if (isRecord(raw)) {
    const id = raw.id;
    const email = raw.email;
    const firstName = raw.firstName;
    const lastName = raw.lastName;
    const language = raw.language;

    if (
      typeof id === "string" &&
      typeof email === "string" &&
      typeof firstName === "string" &&
      typeof lastName === "string" &&
      typeof language === "string"
    ) {
      return { id, email, firstName, lastName, language };
    }
  }

  throw validationFailed("Candidate relation missing", { field: "candidate" });
}

function mapApplicationWithCandidate(model: Application): ApplicationWithCandidateEntity {
  const candidateRaw: unknown = model.get("candidate");
  return {
    ...mapApplicationModelToEntity(model),
    candidate: mapCandidateToPublicEntity(candidateRaw),
  };
}

function decodeCursor(raw?: string): CursorPayload | null {
  if (!raw) return null;

  try {
    const json = Buffer.from(raw, "base64").toString("utf8");
    const parsed: unknown = JSON.parse(json);

    if (!isRecord(parsed)) return null;

    const createdAt = parsed.createdAt;
    const id = parsed.id;

    if (typeof createdAt !== "string" || typeof id !== "string") return null;

    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return null;

    return { createdAt, id };
  } catch {
    return null;
  }
}

function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

function appendAnd(where: WhereOptions, condition: WhereOptions): WhereOptions {
  const current: WhereWithAnd = where;
  const existing = current[Op.and];

  if (Array.isArray(existing)) {
    return {
      ...where,
      [Op.and]: [...existing, condition],
    };
  }

  if (existing) {
    return {
      ...where,
      [Op.and]: [existing, condition],
    };
  }

  return {
    ...where,
    [Op.and]: [condition],
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

export async function listMyApplicationsPaged(
  filter: ListMyApplicationsPagedFilter,
): Promise<ListMyApplicationsPagedResult> {
  let where: WhereOptions = { candidateId: filter.candidateId };

  const cursor = decodeCursor(filter.cursor);
  if (cursor) {
    const cursorDate = new Date(cursor.createdAt);

    const cursorCondition: WhereOptions = {
      [Op.or]: [
        { createdAt: { [Op.lt]: cursorDate } },
        { [Op.and]: [{ createdAt: cursorDate }, { id: { [Op.lt]: cursor.id } }] },
      ],
    };

    where = appendAnd(where, cursorCondition);
  }

  const take = Math.max(1, Math.min(50, Math.floor(filter.limit)));
  const rows = await Application.findAll({
    where,
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
    limit: take + 1,
  });

  const hasMore = rows.length > take;
  const sliced = hasMore ? rows.slice(0, take) : rows;

  const items = sliced.map(mapApplicationModelToEntity);

  let nextCursor: string | null = null;
  if (hasMore && sliced.length > 0) {
    const last = sliced[sliced.length - 1]!;
    nextCursor = encodeCursor({
      createdAt: last.createdAt.toISOString(),
      id: last.id,
    });
  }

  return { items, nextCursor };
}

export async function listApplicationsByVacancyPaged(
  filter: ListApplicationsByVacancyPagedFilter,
): Promise<ListApplicationsByVacancyPagedResult> {
  let where: WhereOptions = { vacancyId: filter.vacancyId };

  if (filter.status) {
    where = { ...where, status: filter.status };
  }

  const cursor = decodeCursor(filter.cursor);
  if (cursor) {
    const cursorDate = new Date(cursor.createdAt);

    const cursorCondition: WhereOptions = {
      [Op.or]: [
        { createdAt: { [Op.lt]: cursorDate } },
        { [Op.and]: [{ createdAt: cursorDate }, { id: { [Op.lt]: cursor.id } }] },
      ],
    };

    where = appendAnd(where, cursorCondition);
  }

  const take = Math.max(1, Math.min(50, Math.floor(filter.limit)));

  const q = filter.q?.trim();

  const candidateAttributes: string[] = ["id", "email", "firstName", "lastName", "language"];

  const includeCandidateBase: IncludeOptions = {
    model: Candidate,
    as: "candidate",
    attributes: candidateAttributes,
    required: true,
  };

  const includeCandidate: IncludeOptions = q
    ? ({
        ...includeCandidateBase,
        where: {
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${q}%` } },
            { lastName: { [Op.iLike]: `%${q}%` } },
            { email: { [Op.iLike]: `%${q}%` } },
          ],
        } satisfies WhereOptions,
      } as IncludeOptions)
    : includeCandidateBase;

  const rows = await Application.findAll({
    where,
    include: [includeCandidate],
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
    limit: take + 1,
  });

  const hasMore = rows.length > take;
  const sliced = hasMore ? rows.slice(0, take) : rows;

  const items = sliced.map(mapApplicationWithCandidate);

  let nextCursor: string | null = null;
  if (hasMore && sliced.length > 0) {
    const last = sliced[sliced.length - 1]!;
    nextCursor = encodeCursor({
      createdAt: last.createdAt.toISOString(),
      id: last.id,
    });
  }

  return { items, nextCursor };
}
