import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  Sequelize,
} from "sequelize";
import type { LocaleCode, CompanyUserRole } from "../../domain/types";
import type { Company } from "./Company";

export class CompanyUser extends Model<
  InferAttributes<CompanyUser>,
  InferCreationAttributes<CompanyUser>
> {
  declare id: CreationOptional<string>;
  declare companyId: ForeignKey<Company["id"]>;
  declare email: string;
  declare passwordHash: string;
  declare role: CompanyUserRole;
  declare position: string | null;
  declare language: LocaleCode;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize): typeof CompanyUser {
    CompanyUser.init(
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
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        passwordHash: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        role: {
          type: DataTypes.ENUM("admin", "recruiter"),
          allowNull: false,
        },
        position: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        language: {
          type: DataTypes.ENUM("am", "ru", "en"),
          allowNull: false,
          defaultValue: "en",
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
        tableName: "company_users",
        modelName: "CompanyUser",
        timestamps: true,
        underscored: true,
        indexes: [
          {
            name: "company_users_company_id_idx",
            fields: ["company_id"],
          },
          {
            name: "company_users_company_email_unique",
            unique: true,
            fields: ["company_id", "email"],
          },
        ],
      },
    );

    return CompanyUser;
  }
}
