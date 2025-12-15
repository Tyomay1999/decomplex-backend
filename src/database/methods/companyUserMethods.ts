import type {
  Attributes,
  CreationAttributes,
  FindOptions,
  Transaction,
  WhereOptions,
} from "sequelize";
import { Op } from "sequelize";

import { CompanyUser } from "../models/CompanyUser";
import { conflict, notFound } from "../../errors/DomainError";
import type { CompanyUserRole, LocaleCode } from "../../domain/types";

export type CompanyUserInstance = CompanyUser;
export type CompanyUserAttributes = Attributes<CompanyUser>;
export type CompanyUserCreationAttributes = CreationAttributes<CompanyUser>;

export type CompanyUserInclude = "company";

export interface MethodOptions {
  transaction?: Transaction;
}

export interface FindCompanyUserOptions extends MethodOptions {
  include?: CompanyUserInclude[];
}

export interface ListCompanyUsersFilter {
  role?: CompanyUserRole;
  language?: LocaleCode;
  search?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface ListCompanyUsersOptions extends MethodOptions, PaginationOptions {
  include?: CompanyUserInclude[];
}

function buildInclude(include?: CompanyUserInclude[]) {
  if (!include || include.length === 0) return undefined;

  const includeDefinitions: NonNullable<FindOptions["include"]> = [];

  if (include.includes("company")) {
    includeDefinitions.push({ association: "company" });
  }

  return includeDefinitions;
}

export async function maybeFindCompanyUserById(
  id: string,
  options: FindCompanyUserOptions = {},
): Promise<CompanyUserInstance | null> {
  const { transaction, include } = options;

  const findOptions: FindOptions<CompanyUserAttributes> = {
    where: { id },
    transaction,
    include: buildInclude(include),
  };

  return CompanyUser.findOne(findOptions);
}

export async function findCompanyUserByIdOrThrow(
  id: string,
  options: FindCompanyUserOptions = {},
): Promise<CompanyUserInstance> {
  const user = await maybeFindCompanyUserById(id, options);

  if (!user) {
    throw notFound("COMPANY_USER_NOT_FOUND", `CompanyUser with id=${id} not found`, { id });
  }

  return user;
}

export async function maybeFindCompanyUserByEmailWithinCompany(
  companyId: string,
  email: string,
  options: FindCompanyUserOptions = {},
): Promise<CompanyUserInstance | null> {
  const { transaction, include } = options;

  const whereOptions: { email: string; companyId: string } = {
    email,
    companyId,
  };

  const findOptions: FindOptions<CompanyUserAttributes> = {
    where: whereOptions,
    transaction,
    include: buildInclude(include),
  };

  return CompanyUser.findOne(findOptions);
}

export async function findCompanyUserByEmailWithinCompanyOrThrow(
  companyId: string,
  email: string,
  options: FindCompanyUserOptions = {},
): Promise<CompanyUserInstance> {
  const user = await maybeFindCompanyUserByEmailWithinCompany(companyId, email, options);

  if (!user) {
    throw notFound(
      "COMPANY_USER_NOT_FOUND",
      `CompanyUser with email=${email} in companyId=${companyId} not found`,
      { companyId, email },
    );
  }

  return user;
}

export async function findCompanyUserByCompanyAndEmailOrThrow(
  companyId: string,
  email: string,
  options: FindCompanyUserOptions = {},
): Promise<CompanyUserInstance> {
  return findCompanyUserByEmailWithinCompanyOrThrow(companyId, email, options);
}

export interface FindCompanyUsersByEmailOptions extends MethodOptions {
  include?: CompanyUserInclude[];
}

export async function findCompanyUsersByEmail(
  email: string,
  options: FindCompanyUsersByEmailOptions = {},
): Promise<CompanyUserInstance[]> {
  const { transaction, include } = options;

  const findOptions: FindOptions<CompanyUserAttributes> = {
    where: { email },
    transaction,
    include: buildInclude(include),
  };

  return CompanyUser.findAll(findOptions);
}

type CompanyUserWhere = WhereOptions<CompanyUserAttributes> & {
  [K in typeof Op.or]?: unknown;
};

export async function listCompanyUsers(
  companyId: string,
  filter: ListCompanyUsersFilter = {},
  options: ListCompanyUsersOptions = {},
): Promise<{ rows: CompanyUserInstance[]; count: number }> {
  const { role, language, search } = filter;
  const { limit, offset, transaction, include } = options;

  const where: CompanyUserWhere = { companyId };

  if (role) {
    where.role = role;
  }

  if (language) {
    where.language = language;
  }

  if (search) {
    const likePattern = `%${search}%`;

    where[Op.or] = [
      { email: { [Op.iLike]: likePattern } },
      { position: { [Op.iLike]: likePattern } },
    ];
  }

  const findOptions: FindOptions<CompanyUserAttributes> = {
    where,
    limit,
    offset,
    transaction,
    include: buildInclude(include),
    order: [["createdAt", "DESC"]],
  };

  return CompanyUser.findAndCountAll(findOptions);
}

export interface CreateCompanyUserPayload {
  companyId: string;
  email: string;
  passwordHash: string;
  role: CompanyUserRole;
  position?: string | null;
  language: LocaleCode;
}

export async function createCompanyUser(
  payload: CreateCompanyUserPayload,
  options: MethodOptions = {},
): Promise<CompanyUserInstance> {
  const { transaction } = options;

  const existing = await CompanyUser.findOne({
    where: {
      companyId: payload.companyId,
      email: payload.email,
    },
    transaction,
  });

  if (existing) {
    throw conflict(
      "COMPANY_USER_EMAIL_CONFLICT",
      `CompanyUser with email=${payload.email} already exists in companyId=${payload.companyId}`,
      {
        companyId: payload.companyId,
        email: payload.email,
      },
    );
  }

  const data: CompanyUserCreationAttributes = {
    companyId: payload.companyId,
    email: payload.email,
    passwordHash: payload.passwordHash,
    role: payload.role,
    position: payload.position ?? null,
    language: payload.language,
  };

  const user = await CompanyUser.create(data, { transaction });

  return user;
}

export interface UpdateCompanyUserPayload {
  role?: CompanyUserRole;
  position?: string | null;
  language?: LocaleCode;
}

export async function updateCompanyUser(
  id: string,
  changes: UpdateCompanyUserPayload,
  options: MethodOptions = {},
): Promise<CompanyUserInstance> {
  const { transaction } = options;

  const user = await findCompanyUserByIdOrThrow(id, { transaction });

  if (typeof changes.role !== "undefined") {
    user.role = changes.role;
  }

  if (typeof changes.position !== "undefined") {
    user.position = changes.position;
  }

  if (typeof changes.language !== "undefined") {
    user.language = changes.language;
  }

  await user.save({ transaction });

  return user;
}

export async function deleteCompanyUser(id: string, options: MethodOptions = {}): Promise<void> {
  const { transaction } = options;

  const user = await findCompanyUserByIdOrThrow(id, { transaction });

  await user.destroy({ transaction });
}
