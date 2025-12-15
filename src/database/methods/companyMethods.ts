import type {
  Attributes,
  CreationAttributes,
  FindOptions,
  Transaction,
  WhereOptions,
} from "sequelize";
import { Op } from "sequelize";

import { Company } from "../models/Company";
import { conflict, notFound } from "../../errors/DomainError";
import type { CompanyStatus, LocaleCode } from "../../domain/types";

export type CompanyInstance = Company;
export type CompanyAttributes = Attributes<Company>;
export type CompanyCreationAttributes = CreationAttributes<Company>;

export type CompanyInclude = "users" | "vacancies";

export interface MethodOptions {
  transaction?: Transaction;
}

export interface FindCompanyOptions extends MethodOptions {
  include?: CompanyInclude[];
}

export interface ListCompaniesFilter {
  status?: CompanyStatus;
  defaultLocale?: LocaleCode;
  search?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface ListCompaniesOptions extends MethodOptions, PaginationOptions {
  include?: CompanyInclude[];
}

function buildInclude(include?: CompanyInclude[]) {
  if (!include || include.length === 0) return undefined;

  const includeDefinitions: NonNullable<FindOptions["include"]> = [];

  if (include.includes("users")) {
    includeDefinitions.push({ association: "users" });
  }

  if (include.includes("vacancies")) {
    includeDefinitions.push({ association: "vacancies" });
  }

  return includeDefinitions;
}

export async function maybeFindCompanyById(
  id: string,
  options: FindCompanyOptions = {},
): Promise<CompanyInstance | null> {
  const { transaction, include } = options;

  const findOptions: FindOptions<CompanyAttributes> = {
    where: { id },
    transaction,
    include: buildInclude(include),
  };

  return Company.findOne(findOptions);
}

export async function findCompanyByIdOrThrow(
  id: string,
  options: FindCompanyOptions = {},
): Promise<CompanyInstance> {
  const company = await maybeFindCompanyById(id, options);

  if (!company) {
    throw notFound("COMPANY_NOT_FOUND", `Company with id=${id} not found`, {
      id,
    });
  }

  return company;
}

export async function maybeFindCompanyByEmail(
  email: string,
  options: FindCompanyOptions = {},
): Promise<CompanyInstance | null> {
  const { transaction, include } = options;

  const findOptions: FindOptions<CompanyAttributes> = {
    where: { email },
    transaction,
    include: buildInclude(include),
  };

  return Company.findOne(findOptions);
}

export async function findCompanyByEmailOrThrow(
  email: string,
  options: FindCompanyOptions = {},
): Promise<CompanyInstance> {
  const company = await maybeFindCompanyByEmail(email, options);

  if (!company) {
    throw notFound("COMPANY_NOT_FOUND", `Company with email=${email} not found`, { email });
  }

  return company;
}

export async function listCompanies(
  filter: ListCompaniesFilter = {},
  options: ListCompaniesOptions = {},
): Promise<{ rows: CompanyInstance[]; count: number }> {
  const { status, defaultLocale, search } = filter;
  const { limit, offset, transaction, include } = options;

  type CompanyWhere = WhereOptions<CompanyAttributes> & {
    [key: symbol]: unknown;
  };

  const where: CompanyWhere = {};

  if (status) {
    (where as Record<string, unknown>).status = status;
  }

  if (defaultLocale) {
    (where as Record<string, unknown>).defaultLocale = defaultLocale;
  }
  if (search) {
    const likePattern = `%${search}%`;

    where[Op.or] = [{ name: { [Op.iLike]: likePattern } }, { email: { [Op.iLike]: likePattern } }];
  }

  const findOptions: FindOptions<CompanyAttributes> = {
    where,
    limit,
    offset,
    transaction,
    include: buildInclude(include),
    order: [["createdAt", "DESC"]],
  };

  return Company.findAndCountAll(findOptions);
}

export interface CreateCompanyPayload {
  name: string;
  email: string;
  passwordHash: string;
  defaultLocale: LocaleCode;
  status?: CompanyStatus;
}

export async function createCompany(
  payload: CreateCompanyPayload,
  options: MethodOptions = {},
): Promise<CompanyInstance> {
  const { transaction } = options;

  const existing = await Company.findOne({
    where: { email: payload.email },
    transaction,
  });

  if (existing) {
    throw conflict("COMPANY_EMAIL_CONFLICT", `Company with email=${payload.email} already exists`, {
      email: payload.email,
    });
  }

  const data: CompanyCreationAttributes = {
    name: payload.name,
    email: payload.email,
    passwordHash: payload.passwordHash,
    defaultLocale: payload.defaultLocale,
    status: payload.status ?? "active",
  };

  const company = await Company.create(data, { transaction });

  return company;
}

export interface UpdateCompanyPayload {
  name?: string;
  defaultLocale?: LocaleCode;
  status?: CompanyStatus;
}

export async function updateCompany(
  id: string,
  changes: UpdateCompanyPayload,
  options: MethodOptions = {},
): Promise<CompanyInstance> {
  const { transaction } = options;

  const company = await findCompanyByIdOrThrow(id, { transaction });

  if (typeof changes.name !== "undefined") {
    company.name = changes.name;
  }

  if (typeof changes.defaultLocale !== "undefined") {
    company.defaultLocale = changes.defaultLocale;
  }

  if (typeof changes.status !== "undefined") {
    company.status = changes.status;
  }

  await company.save({ transaction });

  return company;
}

export async function changeCompanyStatus(
  id: string,
  status: CompanyStatus,
  options: MethodOptions = {},
): Promise<CompanyInstance> {
  return updateCompany(id, { status }, options);
}

export async function deleteCompany(id: string, options: MethodOptions = {}): Promise<void> {
  const { transaction } = options;

  const company = await findCompanyByIdOrThrow(id, { transaction });

  await company.destroy({ transaction });
}
