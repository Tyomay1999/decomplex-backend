"use strict";

const { v4: uuid } = require("uuid");

function pick(arr, i) {
  return arr[i % arr.length];
}

function chunk(arr, start, count) {
  const out = [];
  for (let k = 0; k < count; k++) out.push(arr[(start + k) % arr.length]);
  return out;
}

function bullets(items) {
  return items.map((x) => `- ${x}`).join("\n");
}

function buildVacancyDescription({ i, title, companyName, location, jobType }) {
  const seniority = ["Junior", "Middle", "Senior", "Lead"];
  const stacks = [
    ["Node.js", "Express", "PostgreSQL", "Redis", "RabbitMQ", "Docker"],
    ["React", "TypeScript", "Vite", "Redux Toolkit", "RTK Query", "i18n"],
    ["Next.js", "App Router", "TypeScript", "SSR", "SEO", "i18n"],
    ["CI/CD", "GitHub Actions", "Docker", "Linux", "Observability"],
    ["QA Automation", "Playwright", "Cypress", "Jest", "CI"],
  ];

  const domains = ["Recruiting platform", "HRTech", "B2B SaaS", "Marketplace", "Internal tools"];
  const workModes = ["Remote-first", "Hybrid", "Office-friendly", "Distributed team"];

  const benefits = [
    "Flexible working hours and clear async communication.",
    "Paid vacation and sick leave according to local policy.",
    "Learning budget: courses, books, and conference tickets.",
    "Modern laptop and tooling budget after probation.",
    "Regular performance reviews with transparent growth path.",
    "English practice and mentoring sessions.",
  ];

  const responsibilityPool = [
    "Design and implement new product features end-to-end.",
    "Build and maintain REST APIs with clean architecture principles.",
    "Write maintainable code with meaningful tests and code reviews.",
    "Collaborate with PM/Design to refine requirements and UX flows.",
    "Optimize performance, reliability, and developer experience.",
    "Contribute to documentation, CI pipelines, and release process.",
    "Investigate production issues and improve observability (logs/metrics).",
  ];

  const requirementPool = [
    "Strong JavaScript/TypeScript fundamentals and clean coding practices.",
    "Experience with SQL and relational database design (PostgreSQL preferred).",
    "Understanding of authentication flows, sessions/JWT, and security basics.",
    "Ability to work with Git, PR workflows, and collaborative development.",
    "Comfortable with debugging, profiling, and performance optimization.",
    "Good communication skills and ownership mindset.",
  ];

  const niceToHavePool = [
    "Experience with Redis, queues (RabbitMQ), or event-driven systems.",
    "Experience with Docker and CI/CD pipelines.",
    "Knowledge of i18n, localization, and multi-tenant applications.",
    "Production experience with monitoring/observability tools.",
    "Experience with Next.js or React Native (Expo).",
  ];

  const lvl = seniority[i % seniority.length];
  const domain = domains[i % domains.length];
  const mode = workModes[i % workModes.length];
  const tech = stacks[i % stacks.length];

  const responsibilities = chunk(responsibilityPool, i, 5 + (i % 2));
  const requirements = chunk(requirementPool, i + 2, 5);
  const niceToHave = chunk(niceToHavePool, i + 1, 4);
  const perks = chunk(benefits, i, 4 + (i % 3));

  const salaryNote =
    i % 3 === 0
      ? "Salary is negotiable based on seniority and interview results."
      : "We offer a competitive salary range aligned with your experience.";

  const process =
    i % 2 === 0
      ? "Hiring process: HR intro (20 min) → Technical interview → Short practical task → Final call."
      : "Hiring process: Recruiter screening → Technical deep-dive → Team fit interview → Offer.";

  return [
    "About the role",
    `${companyName} is building a ${domain}. We are looking for a ${lvl} ${title} to help us deliver stable, scalable features with a strong focus on code quality and product impact.`,
    "",
    "Work format",
    `- Location: ${location}`,
    `- Type: ${String(jobType).replace("_", " ")}`,
    `- Mode: ${mode}`,
    "",
    "Tech stack",
    `- ${tech.join(", ")}`,
    "",
    "Responsibilities",
    bullets(responsibilities),
    "",
    "Requirements",
    bullets(requirements),
    "",
    "Nice to have",
    bullets(niceToHave),
    "",
    "Benefits",
    bullets(perks),
    "",
    "Compensation",
    salaryNote,
    "",
    process,
    "",
    `Note: Vacancy #${i + 1}.`,
  ].join("\n");
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const { QueryTypes } = Sequelize;

    const companies = await queryInterface.sequelize.query(
      `SELECT id, email, name FROM companies WHERE email IN (:emails)`,
      {
        replacements: {
          emails: ["contact@decomplex-tech.com", "contact@acme-recruiting.com"],
        },
        type: QueryTypes.SELECT,
      },
    );

    const company1 = (companies || []).find((c) => c.email === "contact@decomplex-tech.com");
    const company2 = (companies || []).find((c) => c.email === "contact@acme-recruiting.com");

    if (!company1 || !company2) {
      return;
    }

    const users = await queryInterface.sequelize.query(
      `SELECT id, email FROM company_users WHERE email IN (:emails)`,
      {
        replacements: {
          emails: ["recruiter@decomplex-tech.com", "admin@acme-recruiting.com"],
        },
        type: QueryTypes.SELECT,
      },
    );

    const recruiter1 = (users || []).find((u) => u.email === "recruiter@decomplex-tech.com");
    const admin2 = (users || []).find((u) => u.email === "admin@acme-recruiting.com");

    if (!recruiter1 || !admin2) return;

    const existingVac = await queryInterface.sequelize.query(
      `SELECT 1 FROM vacancies WHERE company_id IN (:companyIds) LIMIT 1`,
      {
        replacements: { companyIds: [company1.id, company2.id] },
        type: QueryTypes.SELECT,
      },
    );

    if (Array.isArray(existingVac) && existingVac.length > 0) return;

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

    const jobTypes = ["full_time", "part_time", "remote", "hybrid"];
    const locations = [
      "Yerevan, Armenia",
      "Tbilisi, Georgia",
      "Remote",
      "Berlin, Germany",
      "Amsterdam, Netherlands",
    ];

    const VACANCIES_COUNT = 120;
    const vacanciesToInsert = [];

    for (let i = 0; i < VACANCIES_COUNT; i++) {
      const id = uuid();
      const isCompany1 = i % 2 === 0;

      const companyId = isCompany1 ? company1.id : company2.id;
      const createdById = isCompany1 ? recruiter1.id : admin2.id;
      const companyName = isCompany1 ? company1.name : company2.name;

      const title = pick(titles, i);
      const jobType = pick(jobTypes, i);
      const location = pick(locations, i);

      const description = buildVacancyDescription({
        i,
        title,
        companyName,
        location,
        jobType,
      });

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
        job_type: jobType,
        location,
        status: i % 12 === 0 ? "archived" : "active",
        created_at: createdAt,
        updated_at: now,
      });
    }

    await queryInterface.bulkInsert("vacancies", vacanciesToInsert);
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
    if (!companyIds.length) return;

    const users = await queryInterface.sequelize.query(
      `SELECT id FROM company_users WHERE email IN (:emails)`,
      {
        replacements: {
          emails: ["recruiter@decomplex-tech.com", "admin@acme-recruiting.com"],
        },
        type: QueryTypes.SELECT,
      },
    );
    const createdByIds = (users || []).map((u) => u.id);

    const vacancies = await queryInterface.sequelize.query(
      `SELECT id FROM vacancies WHERE company_id IN (:companyIds) OR created_by_id IN (:createdByIds)`,
      {
        replacements: {
          companyIds: companyIds.length ? companyIds : ["__none__"],
          createdByIds: createdByIds.length ? createdByIds : ["__none__"],
        },
        type: QueryTypes.SELECT,
      },
    );

    const vacancyIds = (vacancies || []).map((v) => v.id);

    if (vacancyIds.length) {
      await queryInterface.bulkDelete("applications", { vacancy_id: vacancyIds }, {});
      await queryInterface.bulkDelete("vacancies", { id: vacancyIds }, {});
    }
  },
};
