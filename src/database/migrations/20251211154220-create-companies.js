"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.createTable("companies", {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      default_locale: {
        type: DataTypes.ENUM("hy", "ru", "en"),
        allowNull: false,
        defaultValue: "en",
      },
      status: {
        type: DataTypes.ENUM("active", "suspended"),
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

    await queryInterface.addIndex("companies", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("companies", ["status"]);
    await queryInterface.dropTable("companies");

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_companies_default_locale";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_companies_status";');
  },
};
