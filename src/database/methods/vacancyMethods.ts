import { Vacancy } from "../models/Vacancy";
import type { VacancyJobType, VacancyStatus } from "../../domain/types";
import type { DbOptions } from "./types";
import { Op, WhereOptions } from "sequelize";

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

export interface ListVacanciesFilter {
  companyId?: string;
  status?: VacancyStatus;
  jobType?: VacancyJobType;
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

type CursorPayload = { createdAt: string; id: string };

function decodeCursor(raw?: string): CursorPayload | null {
  if (!raw) return null;

  try {
    const json = Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json) as { createdAt?: unknown; id?: unknown };

    if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") return null;

    const date = new Date(parsed.createdAt);
    if (Number.isNaN(date.getTime())) return null;

    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export interface ListVacanciesPagedFilter extends ListVacanciesFilter {
  q?: string;
  limit: number;
  cursor?: string;
}

export interface ListVacanciesPagedResult {
  items: VacancyEntity[];
  nextCursor: string | null;
}

export async function listVacanciesPaged(
  filter: ListVacanciesPagedFilter,
): Promise<ListVacanciesPagedResult> {
  const where: WhereOptions = {};

  if (filter.companyId) where.companyId = filter.companyId;
  if (filter.status) where.status = filter.status;
  if (filter.jobType) where.jobType = filter.jobType;

  const q = filter.q?.trim();
  if (q) {
    Object.assign(where, {
      [Op.or]: [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { location: { [Op.iLike]: `%${q}%` } },
      ],
    });
  }

  const cursor = decodeCursor(filter.cursor);
  if (cursor) {
    const cursorDate = new Date(cursor.createdAt);

    const cursorCondition: WhereOptions = {
      [Op.or]: [
        { createdAt: { [Op.lt]: cursorDate } },
        {
          [Op.and]: [{ createdAt: cursorDate }, { id: { [Op.lt]: cursor.id } }],
        },
      ],
    };

    Object.assign(where, {
      [Op.and]: [cursorCondition],
    });
  }

  const take = Math.max(1, Math.min(50, Math.floor(filter.limit)));
  const rows = await Vacancy.findAll({
    where,
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
    limit: take + 1,
  });

  const hasMore = rows.length > take;
  const sliced = hasMore ? rows.slice(0, take) : rows;

  const items = sliced.map(mapVacancyModelToEntity);

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
