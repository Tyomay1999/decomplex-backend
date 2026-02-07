"use strict";

const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const { QueryTypes } = Sequelize;

    const existing = await queryInterface.sequelize.query(
      `SELECT 1 FROM candidates WHERE email = :email LIMIT 1`,
      {
        replacements: { email: "john.doe@example.com" },
        type: QueryTypes.SELECT,
      },
    );

    if (Array.isArray(existing) && existing.length > 0) return;

    const candidatePasswordHash = await bcrypt.hash("Candidate123!", 10);

    await queryInterface.bulkInsert("candidates", [
      {
        id: uuid(),
        email: "john.doe@example.com",
        password_hash: candidatePasswordHash,
        first_name: "John",
        last_name: "Doe",
        language: "en",
        created_at: now,
        updated_at: now,
      },
      {
        id: uuid(),
        email: "jane.smith@example.com",
        password_hash: candidatePasswordHash,
        first_name: "Jane",
        last_name: "Smith",
        language: "en",
        created_at: now,
        updated_at: now,
      },
      {
        id: uuid(),
        email: "aram.petrossian@example.com",
        password_hash: candidatePasswordHash,
        first_name: "Aram",
        last_name: "Petrossian",
        language: "ru",
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    const { QueryTypes } = Sequelize;

    const candidates = await queryInterface.sequelize.query(
      `SELECT id FROM candidates WHERE email IN (:emails)`,
      {
        replacements: {
          emails: ["john.doe@example.com", "jane.smith@example.com", "aram.petrossian@example.com"],
        },
        type: QueryTypes.SELECT,
      },
    );

    const candidateIds = (candidates || []).map((c) => c.id);

    if (candidateIds.length) {
      await queryInterface.bulkDelete("candidates", { id: candidateIds }, {});
    }
  },
};
