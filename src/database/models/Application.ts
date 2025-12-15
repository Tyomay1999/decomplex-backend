import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  Sequelize,
} from "sequelize";
import type { ApplicationStatus } from "../../domain/types";
import type { Vacancy } from "./Vacancy";
import type { Candidate } from "./Candidate";

export class Application extends Model<
  InferAttributes<Application>,
  InferCreationAttributes<Application>
> {
  declare id: CreationOptional<string>;
  declare vacancyId: ForeignKey<Vacancy["id"]>;
  declare candidateId: ForeignKey<Candidate["id"]>;
  declare cvFilePath: string;
  declare coverLetter: string | null;
  declare status: ApplicationStatus;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize): typeof Application {
    Application.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        vacancyId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "vacancy_id",
        },
        candidateId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "candidate_id",
        },
        cvFilePath: {
          type: DataTypes.STRING(512),
          allowNull: false,
          field: "cv_file_path",
        },
        coverLetter: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "cover_letter",
        },
        status: {
          type: DataTypes.ENUM("applied", "viewed", "interview", "rejected", "accepted"),
          allowNull: false,
          defaultValue: "applied",
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
        tableName: "applications",
        modelName: "Application",
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ["vacancy_id"] },
          { fields: ["candidate_id"] },
          { fields: ["status"] },
          {
            name: "applications_unique_candidate_vacancy",
            unique: true,
            fields: ["candidate_id", "vacancy_id"],
          },
        ],
      },
    );

    return Application;
  }
}
