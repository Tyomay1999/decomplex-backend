import type { Sequelize } from "sequelize";
import { Company } from "./Company";
import { CompanyUser } from "./CompanyUser";
import { Candidate } from "./Candidate";
import { Vacancy } from "./Vacancy";
import { Application } from "./Application";
import { logger } from "../../lib/logger";

export function initModels(sequelize: Sequelize) {
  Company.initModel(sequelize);
  CompanyUser.initModel(sequelize);
  Candidate.initModel(sequelize);
  Vacancy.initModel(sequelize);
  Application.initModel(sequelize);

  Company.hasMany(CompanyUser, {
    as: "users",
    foreignKey: "companyId",
    sourceKey: "id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  CompanyUser.belongsTo(Company, {
    as: "company",
    foreignKey: "companyId",
    targetKey: "id",
  });

  Company.hasMany(Vacancy, {
    as: "vacancies",
    foreignKey: "companyId",
    sourceKey: "id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  Vacancy.belongsTo(Company, {
    as: "company",
    foreignKey: "companyId",
    targetKey: "id",
  });

  CompanyUser.hasMany(Vacancy, {
    as: "createdVacancies",
    foreignKey: "createdById",
    sourceKey: "id",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });
  Vacancy.belongsTo(CompanyUser, {
    as: "createdBy",
    foreignKey: "createdById",
    targetKey: "id",
  });

  Candidate.hasMany(Application, {
    as: "applications",
    foreignKey: "candidateId",
    sourceKey: "id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  Application.belongsTo(Candidate, {
    as: "candidate",
    foreignKey: "candidateId",
    targetKey: "id",
  });

  Vacancy.hasMany(Application, {
    as: "applications",
    foreignKey: "vacancyId",
    sourceKey: "id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  Application.belongsTo(Vacancy, {
    as: "vacancy",
    foreignKey: "vacancyId",
    targetKey: "id",
  });

  logger.info("Sequelize models initialized");

  return {
    Company,
    CompanyUser,
    Candidate,
    Vacancy,
    Application,
  };
}
