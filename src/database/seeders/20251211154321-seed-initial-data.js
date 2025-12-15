"use strict";

const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // -----------------------------
    // Idempotency guard (safe re-run)
    // -----------------------------
    const { QueryTypes } = Sequelize;
    const existing = await queryInterface.sequelize.query(
      `SELECT 1 FROM companies WHERE email = :email LIMIT 1`,
      {
        replacements: { email: "contact@decomplex-tech.com" },
        type: QueryTypes.SELECT,
      },
    );

    if (Array.isArray(existing) && existing.length > 0) {
      // Data already seeded, do nothing
      return;
    }

    // -----------------------------
    // IDs
    // -----------------------------
    const company1Id = uuid();
    const company2Id = uuid();

    const company1AdminId = uuid();
    const company1RecruiterId = uuid();
    const company2AdminId = uuid();

    const candidate1Id = uuid();
    const candidate2Id = uuid();
    const candidate3Id = uuid();

    const vacancy1Id = uuid();
    const vacancy2Id = uuid();
    const vacancy3Id = uuid();

    const application1Id = uuid();
    const application2Id = uuid();
    const application3Id = uuid();
    const application4Id = uuid();

    // -----------------------------
    // Passwords
    // -----------------------------
    const commonPassword = "Password123!";
    const companyPasswordHash = await bcrypt.hash(commonPassword, 10);
    const candidatePasswordHash = await bcrypt.hash("Candidate123!", 10);

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

    // -----------------------------
    // Insert candidates
    // -----------------------------
    await queryInterface.bulkInsert("candidates", [
      {
        id: candidate1Id,
        email: "john.doe@example.com",
        password_hash: candidatePasswordHash,
        first_name: "John",
        last_name: "Doe",
        language: "en",
        created_at: now,
        updated_at: now,
      },
      {
        id: candidate2Id,
        email: "jane.smith@example.com",
        password_hash: candidatePasswordHash,
        first_name: "Jane",
        last_name: "Smith",
        language: "en",
        created_at: now,
        updated_at: now,
      },
      {
        id: candidate3Id,
        email: "aram.petrossian@example.com",
        password_hash: candidatePasswordHash,
        first_name: "Aram",
        last_name: "Petrossian",
        language: "ru",
        created_at: now,
        updated_at: now,
      },
    ]);

    // -----------------------------
    // Insert vacancies
    // -----------------------------
    await queryInterface.bulkInsert("vacancies", [
      {
        id: vacancy1Id,
        company_id: company1Id,
        created_by_id: company1RecruiterId,
        title: "Senior Node.js Engineer",
        description:
          "We are looking for a Senior Node.js Engineer to work on our recruitment platform backend.",
        salary_from: 3500,
        salary_to: 5000,
        job_type: "full_time",
        location: "Yerevan, Armenia",
        status: "active",
        created_at: now,
        updated_at: now,
      },
      {
        id: vacancy2Id,
        company_id: company1Id,
        created_by_id: company1RecruiterId,
        title: "React Frontend Developer",
        description: "Frontend role focusing on React, TypeScript and Ant Design.",
        salary_from: 2500,
        salary_to: 4000,
        job_type: "remote",
        location: "Remote",
        status: "active",
        created_at: now,
        updated_at: now,
      },
      {
        id: vacancy3Id,
        company_id: company2Id,
        created_by_id: company2AdminId,
        title: "HR Generalist",
        description: "HR position responsible for full-cycle recruiting and onboarding.",
        salary_from: 1500,
        salary_to: 2200,
        job_type: "hybrid",
        location: "Tbilisi, Georgia",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert("applications", [
      {
        id: application1Id,
        vacancy_id: vacancy1Id,
        candidate_id: candidate1Id,
        cv_file_path: "uploads/cv/john-doe-nodejs.pdf",
        cover_letter: "I have 5+ years of experience with Node.js and TypeScript.",
        status: "applied",
        created_at: now,
        updated_at: now,
      },
      {
        id: application2Id,
        vacancy_id: vacancy1Id,
        candidate_id: candidate2Id,
        cv_file_path: "uploads/cv/jane-smith-backend.pdf",
        cover_letter: "Strong background in backend and microservices.",
        status: "viewed",
        created_at: now,
        updated_at: now,
      },
      {
        id: application3Id,
        vacancy_id: vacancy2Id,
        candidate_id: candidate2Id,
        cv_file_path: "uploads/cv/jane-smith-frontend.pdf",
        cover_letter: "4 years of experience with React and Redux.",
        status: "interview",
        created_at: now,
        updated_at: now,
      },
      {
        id: application4Id,
        vacancy_id: vacancy3Id,
        candidate_id: candidate3Id,
        cv_file_path: "uploads/cv/aram-petrossian-hr.pdf",
        cover_letter: "Experience in HR and recruiting across multiple industries.",
        status: "applied",
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

    const vacancies = await queryInterface.sequelize.query(
      `SELECT id FROM vacancies WHERE company_id IN (:companyIds) OR created_by_id IN (:createdByIds)`,
      {
        replacements: {
          companyIds: companyIds.length ? companyIds : ["__none__"],
          createdByIds: companyUserIds.length ? companyUserIds : ["__none__"],
        },
        type: QueryTypes.SELECT,
      },
    );
    const vacancyIds = (vacancies || []).map((v) => v.id);

    await queryInterface.bulkDelete(
      "applications",
      {
        ...(vacancyIds.length ? { vacancy_id: vacancyIds } : {}),
        ...(candidateIds.length ? { candidate_id: candidateIds } : {}),
      },
      {},
    );

    if (vacancyIds.length) {
      await queryInterface.bulkDelete("vacancies", { id: vacancyIds }, {});
    }

    if (candidateIds.length) {
      await queryInterface.bulkDelete("candidates", { id: candidateIds }, {});
    }

    if (companyUserIds.length) {
      await queryInterface.bulkDelete("company_users", { id: companyUserIds }, {});
    }

    if (companyIds.length) {
      await queryInterface.bulkDelete("companies", { id: companyIds }, {});
    }
  },
};
