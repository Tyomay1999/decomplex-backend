"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.createTable("vacancies", {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      company_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "companies",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      created_by_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "company_users",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      salary_from: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      salary_to: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      job_type: {
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

    await queryInterface.addIndex("vacancies", ["company_id"]);
    await queryInterface.addIndex("vacancies", ["created_by_id"]);
    await queryInterface.addIndex("vacancies", ["status"]);
    await queryInterface.addIndex("vacancies", ["job_type"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("vacancies", ["company_id"]);
    await queryInterface.removeIndex("vacancies", ["created_by_id"]);
    await queryInterface.removeIndex("vacancies", ["status"]);
    await queryInterface.removeIndex("vacancies", ["job_type"]);

    await queryInterface.dropTable("vacancies");

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_vacancies_job_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_vacancies_status";');
  },
};
