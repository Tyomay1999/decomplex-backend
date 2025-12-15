"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.createTable("company_users", {
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
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      password_hash: {
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

    await queryInterface.addIndex("company_users", ["company_id"]);
    await queryInterface.addIndex("company_users", ["company_id", "email"], {
      name: "company_users_company_email_unique",
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("company_users", "company_users_company_email_unique");
    await queryInterface.removeIndex("company_users", ["company_id"]);
    await queryInterface.dropTable("company_users");

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_company_users_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_company_users_language";');
  },
};
