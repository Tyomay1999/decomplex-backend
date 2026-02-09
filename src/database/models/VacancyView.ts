import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  Sequelize,
} from "sequelize";
import type { Vacancy } from "./Vacancy";
import type { Candidate } from "./Candidate";

export class VacancyView extends Model<
  InferAttributes<VacancyView>,
  InferCreationAttributes<VacancyView>
> {
  declare id: CreationOptional<string>;
  declare vacancyId: ForeignKey<Vacancy["id"]>;
  declare candidateId: ForeignKey<Candidate["id"]>;

  declare viewsCount: CreationOptional<number>;
  declare lastViewedAt: CreationOptional<Date>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize): typeof VacancyView {
    VacancyView.init(
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
        viewsCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          field: "views_count",
        },
        lastViewedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: "last_viewed_at",
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
        tableName: "vacancy_views",
        modelName: "VacancyView",
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ["vacancy_id"] },
          { fields: ["candidate_id"] },
          { fields: ["last_viewed_at"] },
          {
            name: "vacancy_views_unique_candidate_vacancy",
            unique: true,
            fields: ["candidate_id", "vacancy_id"],
          },
        ],
      },
    );

    return VacancyView;
  }
}
