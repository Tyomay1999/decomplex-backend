"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeIndex("company_users", "company_users_company_email_unique");

    await queryInterface.addIndex("company_users", ["email"], {
      name: "company_users_email_unique",
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("company_users", "company_users_email_unique");

    await queryInterface.addIndex("company_users", ["company_id", "email"], {
      name: "company_users_company_email_unique",
      unique: true,
    });
  },
};
