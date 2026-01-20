import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
} from "sequelize";
import type { LocaleCode } from "../../domain/types";

export class Candidate extends Model<
  InferAttributes<Candidate>,
  InferCreationAttributes<Candidate>
> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare passwordHash: string;
  declare firstName: string;
  declare lastName: string;
  declare language: LocaleCode;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize): typeof Candidate {
    Candidate.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        passwordHash: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        firstName: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        lastName: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        language: {
          type: DataTypes.ENUM("hy", "ru", "en"),
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
        tableName: "candidates",
        modelName: "Candidate",
        timestamps: true,
        underscored: true,
      },
    );

    return Candidate;
  }
}
