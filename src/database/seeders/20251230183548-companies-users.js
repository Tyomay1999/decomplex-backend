"use strict";

const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const { QueryTypes } = Sequelize;

    // -----------------------------
    // Idempotency guard
    // -----------------------------
    const existing = await queryInterface.sequelize.query(
      `SELECT 1 FROM companies WHERE email = :email LIMIT 1`,
      {
        replacements: { email: "contact@decomplex-tech.com" },
        type: QueryTypes.SELECT,
      },
    );

    if (Array.isArray(existing) && existing.length > 0) return;

    // -----------------------------
    // Passwords
    // -----------------------------
    const commonPassword = "Password123!";
    const companyPasswordHash = await bcrypt.hash(commonPassword, 10);

    // -----------------------------
    // IDs
    // -----------------------------
    const company1Id = uuid();
    const company2Id = uuid();

    const company1AdminId = uuid();
    const company1RecruiterId = uuid();
    const company2AdminId = uuid();

    // -----------------------------
    // Insert companies
    // -----------------------------
    await queryInterface.bulkInsert("companies", [
      {
        id: company1Id,
        name: "Decomplex Tech",
        email: "contact@decomplex-tech.com",
        password_hash: companyPasswordHash,
        default_locale: "en",
        status: "active",
        created_at: now,
        updated_at: now,
      },
      {
        id: company2Id,
        name: "Acme Recruiting",
        email: "contact@acme-recruiting.com",
        password_hash: companyPasswordHash,
        default_locale: "en",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ]);

    // -----------------------------
    // Insert company users
    // -----------------------------
    await queryInterface.bulkInsert("company_users", [
      {
        id: company1AdminId,
        company_id: company1Id,
        email: "admin@decomplex-tech.com",
        password_hash: companyPasswordHash,
        role: "admin",
        position: "Head of HR",
        language: "en",
        created_at: now,
        updated_at: now,
      },
      {
        id: company1RecruiterId,
        company_id: company1Id,
        email: "recruiter@decomplex-tech.com",
        password_hash: companyPasswordHash,
        role: "recruiter",
        position: "Tech Recruiter",
        language: "en",
        created_at: now,
        updated_at: now,
      },
      {
        id: company2AdminId,
        company_id: company2Id,
        email: "admin@acme-recruiting.com",
        password_hash: companyPasswordHash,
        role: "admin",
        position: "Recruitment Lead",
        language: "en",
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    const { QueryTypes } = Sequelize;

    const companies = await queryInterface.sequelize.query(
      `SELECT id FROM companies WHERE email IN (:emails)`,
      {
        replacements: {
          emails: ["contact@decomplex-tech.com", "contact@acme-recruiting.com"],
        },
        type: QueryTypes.SELECT,
      },
    );

    const companyIds = (companies || []).map((c) => c.id);

    const companyUsers = await queryInterface.sequelize.query(
      `SELECT id FROM company_users WHERE email IN (:emails)`,
      {
        replacements: {
          emails: [
            "admin@decomplex-tech.com",
            "recruiter@decomplex-tech.com",
            "admin@acme-recruiting.com",
          ],
        },
        type: QueryTypes.SELECT,
      },
    );

    const companyUserIds = (companyUsers || []).map((u) => u.id);

    if (companyUserIds.length) {
      await queryInterface.bulkDelete("company_users", { id: companyUserIds }, {});
    }

    if (companyIds.length) {
      await queryInterface.bulkDelete("companies", { id: companyIds }, {});
    }
  },
};
