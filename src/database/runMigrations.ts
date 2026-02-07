import path from "path";
import fs from "fs";
import { createRequire } from "module";
import { Umzug, SequelizeStorage } from "umzug";
import { Sequelize } from "sequelize";
import { getSequelize, initDatabase } from "./index";

type CliMigration = {
  up: (queryInterface: unknown, sequelize: typeof Sequelize) => Promise<unknown>;
  down: (queryInterface: unknown, sequelize: typeof Sequelize) => Promise<unknown>;
};

function unwrapCjs<T>(mod: unknown): T {
  const m = mod as { default?: unknown };
  return (m?.default ?? mod) as T;
}

function resolveMigrationsDir(): string {
  const candidates = [
    path.resolve(process.cwd(), "migrations"),
    path.resolve(process.cwd(), "dist", "database", "migrations"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  throw new Error(`Migrations directory not found. Checked: ${candidates.join(", ")}`);
}

async function main(): Promise<void> {
  await initDatabase();

  const sequelize = getSequelize();
  const queryInterface = sequelize.getQueryInterface();

  const migrationsPath = resolveMigrationsDir();

  // CJS-safe require для подгрузки файлов миграций
  const requireCjs = createRequire(__filename);

  const umzug = new Umzug({
    migrations: {
      glob: ["*.js", { cwd: migrationsPath }],
      resolve: ({ name, path: filePath }) => {
        if (!filePath) throw new Error(`Migration path is missing for "${name}"`);

        return {
          name,
          up: async () => {
            const imported = requireCjs(filePath);
            const migration = unwrapCjs<CliMigration>(imported);
            return migration.up(queryInterface, Sequelize);
          },
          down: async () => {
            const imported = requireCjs(filePath);
            const migration = unwrapCjs<CliMigration>(imported);
            return migration.down(queryInterface, Sequelize);
          },
        };
      },
    },
    storage: new SequelizeStorage({ sequelize }),
    logger: undefined,
  });

  await umzug.up();
  await sequelize.close();
}

main().catch(async (err) => {
  console.error("runMigrations failed:", err);
  try {
    const sequelize = getSequelize();
    await sequelize.close();
  } catch {
    // ignore
  }
  process.exit(1);
});
