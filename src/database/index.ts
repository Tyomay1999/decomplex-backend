import { Sequelize } from "sequelize";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { initModels } from "./models";

let sequelize: Sequelize | null = null;

export function getSequelize(): Sequelize {
  if (!sequelize) {
    throw new Error("Sequelize is not initialized. Call initDatabase() first.");
  }
  return sequelize;
}

export async function initDatabase(): Promise<void> {
  if (sequelize) {
    return;
  }

  sequelize = new Sequelize(env.databaseUrl, {
    dialect: "postgres",
    logging: env.nodeEnv === "development" ? (msg) => logger.debug({ msg }, "Sequelize") : false,
    dialectOptions:
      env.nodeEnv === "production"
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : undefined,
  });

  initModels(sequelize);

  const safeDbUrl = (() => {
    try {
      const url = new URL(env.databaseUrl);
      if (url.password) {
        url.password = "***";
      }
      return url.toString();
    } catch {
      return "invalid-url";
    }
  })();

  try {
    await sequelize.authenticate();
    logger.info(
      {
        env: env.nodeEnv,
        databaseUrl: safeDbUrl,
      },
      "Database connection has been established successfully",
    );
  } catch (err) {
    logger.error(
      { env: env.nodeEnv, databaseUrl: safeDbUrl, err },
      "Unable to connect to the database",
    );
    throw err;
  }
}
