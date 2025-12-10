import fs from "fs";
import path from "path";
import pino from "pino";
import { env } from "../config/env";

const targets: pino.TransportTargetOptions[] = [];

if (env.logPretty) {
  targets.push({
    level: env.logLevel,
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  });
}

if (env.logToFile) {
  const baseDir = path.resolve(process.cwd(), env.logDir);
  const infoDir = path.join(baseDir, "info");
  const warnDir = path.join(baseDir, "warn");
  const errorDir = path.join(baseDir, "error");

  [baseDir, infoDir, warnDir, errorDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  targets.push(
    {
      level: "info",
      target: "pino/file",
      options: {
        destination: path.join(infoDir, "info.log"),
        mkdir: true,
      },
    },
    {
      level: "warn",
      target: "pino/file",
      options: {
        destination: path.join(warnDir, "warn.log"),
        mkdir: true,
      },
    },
    {
      level: "error",
      target: "pino/file",
      options: {
        destination: path.join(errorDir, "error.log"),
        mkdir: true,
      },
    },
  );
}

const loggerInstance = pino({
  level: env.logLevel,
  transport: targets.length
    ? {
        targets,
      }
    : undefined,
});

export const logger = loggerInstance;
export const httpLogger = logger.child({ module: "http" });
