import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  Sequelize,
} from "sequelize";
import type { VacancyJobType, VacancyStatus } from "../../domain/types";
import type { Company } from "./Company";
import type { CompanyUser } from "./CompanyUser";

export class Vacancy extends Model<InferAttributes<Vacancy>, InferCreationAttributes<Vacancy>> {
  declare id: CreationOptional<string>;
  declare companyId: ForeignKey<Company["id"]>;
  declare createdById: ForeignKey<CompanyUser["id"]> | null;

  declare title: string;
  declare description: string;
  declare salaryFrom: number | null;
  declare salaryTo: number | null;
  declare jobType: VacancyJobType;
  declare location: string | null;
  declare status: VacancyStatus;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize): typeof Vacancy {
    Vacancy.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        companyId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "company_id",
        },
        createdById: {
          type: DataTypes.UUID,
          allowNull: true,
          field: "created_by_id",
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        salaryFrom: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "salary_from",
        },
        salaryTo: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "salary_to",
        },
        jobType: {
          type: DataTypes.ENUM("full_time", "part_time", "remote", "hybrid"),
          allowNull: false,
        },
        location: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM("active", "archived"),
          allowNull: false,
          defaultValue: "active",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "vacancies",
        modelName: "Vacancy",
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ["company_id"] },
          { fields: ["created_by_id"] },
          { fields: ["status"] },
          { fields: ["job_type"] },
        ],
      },
    );

    return Vacancy;
  }
}
