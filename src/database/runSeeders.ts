import path from "path";
import fs from "fs";
import { createRequire } from "module";
import { Umzug, SequelizeStorage } from "umzug";
import { Sequelize } from "sequelize";
import { getSequelize, initDatabase } from "./index";

type CliSeeder = {
  up: (queryInterface: unknown, sequelize: typeof Sequelize) => Promise<unknown>;
  down?: (queryInterface: unknown, sequelize: typeof Sequelize) => Promise<unknown>;
};

function unwrapCjs<T>(mod: unknown): T {
  const m = mod as { default?: unknown };
  return (m?.default ?? mod) as T;
}

function resolveSeedersDir(): string {
  const candidates = [
    path.resolve(process.cwd(), "seeders"),
    path.resolve(process.cwd(), "dist", "database", "seeders"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  throw new Error(`Seeders directory not found. Checked: ${candidates.join(", ")}`);
}

async function main(): Promise<void> {
  await initDatabase();

  const sequelize = getSequelize();
  const queryInterface = sequelize.getQueryInterface();

  const seedersPath = resolveSeedersDir();

  const requireCjs = createRequire(__filename);

  const umzug = new Umzug({
    migrations: {
      glob: ["*.js", { cwd: seedersPath }],
      resolve: ({ name, path: filePath }) => {
        if (!filePath) throw new Error(`Seeder path is missing for "${name}"`);

        return {
          name,
          up: async () => {
            const imported = requireCjs(filePath);
            const seeder = unwrapCjs<CliSeeder>(imported);
            return seeder.up(queryInterface, Sequelize);
          },
          down: async () => {
            const imported = requireCjs(filePath);
            const seeder = unwrapCjs<CliSeeder>(imported);
            return seeder.down ? seeder.down(queryInterface, Sequelize) : undefined;
          },
        };
      },
    },
    storage: new SequelizeStorage({ sequelize, tableName: "SequelizeSeedMeta" }),
    logger: undefined,
  });

  await umzug.up();
  await sequelize.close();
}

main().catch(async (err) => {
  console.error("runSeeders failed:", err);
  try {
    const sequelize = getSequelize();
    await sequelize.close();
  } catch {
    // ignore
  }
  process.exit(1);
});
