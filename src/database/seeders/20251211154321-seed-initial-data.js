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
    // Insert vacancies (many)
    // -----------------------------
    const titles = [
      "Senior Node.js Engineer",
      "React Frontend Developer",
      "Fullstack JavaScript Developer",
      "Backend Engineer (Node.js)",
      "DevOps Engineer",
      "QA Automation Engineer",
      "Product Manager",
      "UI/UX Designer",
      "Data Analyst",
      "Technical Recruiter",
    ];

    const descriptions = [
      "Join our team to build scalable services and APIs.",
      "Work with React, TypeScript, and modern frontend tooling.",
      "Build reliable backend systems with Node.js and PostgreSQL.",
      "Improve CI/CD pipelines and infrastructure automation.",
      "Create automated tests and improve product quality.",
      "Collaborate with cross-functional teams and deliver features.",
    ];

    const jobTypes = ["full_time", "part_time", "remote", "hybrid"];
    const locations = [
      "Yerevan, Armenia",
      "Tbilisi, Georgia",
      "Remote",
      "Berlin, Germany",
      "Amsterdam, Netherlands",
    ];

    function pick(arr, i) {
      return arr[i % arr.length];
    }

    // Сколько вакансий залить
    const VACANCIES_COUNT = 120;

    const generatedVacancyIds = [];
    const vacanciesToInsert = [];

    for (let i = 0; i < VACANCIES_COUNT; i++) {
      const id = uuid();
      generatedVacancyIds.push(id);

      const isCompany1 = i % 2 === 0;

      const companyId = isCompany1 ? company1Id : company2Id;
      const createdById = isCompany1 ? company1RecruiterId : company2AdminId;

      const title = pick(titles, i);
      const description = `${pick(descriptions, i)} Vacancy #${i + 1}.`;

      const createdAt = new Date(now.getTime() - i * 60 * 1000);

      const salaryFrom = 1500 + (i % 6) * 400;
      const salaryTo = salaryFrom + 1200 + (i % 4) * 500;

      vacanciesToInsert.push({
        id,
        company_id: companyId,
        created_by_id: createdById,
        title,
        description,
        salary_from: salaryFrom,
        salary_to: salaryTo,
        job_type: pick(jobTypes, i),
        location: pick(locations, i),
        status: i % 12 === 0 ? "archived" : "active",
        created_at: createdAt,
        updated_at: now,
      });
    }
    await queryInterface.bulkInsert("vacancies", vacanciesToInsert);

    // await queryInterface.bulkInsert("applications", []);
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
