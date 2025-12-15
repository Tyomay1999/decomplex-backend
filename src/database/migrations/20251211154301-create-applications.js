"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.createTable("applications", {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      vacancy_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "vacancies",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      candidate_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "candidates",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      cv_file_path: {
        type: DataTypes.STRING(512),
        allowNull: false,
      },
      cover_letter: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("applied", "viewed", "interview", "rejected", "accepted"),
        allowNull: false,
        defaultValue: "applied",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.addIndex("applications", ["vacancy_id"]);
    await queryInterface.addIndex("applications", ["candidate_id"]);
    await queryInterface.addIndex("applications", ["status"]);
    await queryInterface.addIndex("applications", ["candidate_id", "vacancy_id"], {
      unique: true,
      name: "applications_unique_candidate_vacancy",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("applications", "applications_unique_candidate_vacancy");
    await queryInterface.removeIndex("applications", ["vacancy_id"]);
    await queryInterface.removeIndex("applications", ["candidate_id"]);
    await queryInterface.removeIndex("applications", ["status"]);

    await queryInterface.dropTable("applications");

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_applications_status";');
  },
};
