import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().default(4000),
  LOG_LEVEL: Joi.string()
    .valid("fatal", "error", "warn", "info", "debug", "trace", "silent")
    .default("info"),
  LOG_PRETTY: Joi.boolean().default(true),
  LOG_TO_FILE: Joi.boolean().default(false),
  LOG_DIR: Joi.string().default("logs"),
  STATIC_DIR: Joi.string().default("static"),
  STATIC_DEFAULT_FOLDER: Joi.string().default("images"),
  UPLOAD_MAX_FILE_SIZE_MB: Joi.number().default(10),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default("1d"),
  REDIS_URL: Joi.string().uri().required(),

  RABBITMQ_URL: Joi.string().uri().required(),
  RABBITMQ_EMAIL_QUEUE: Joi.string().default("email_queue"),

  DATABASE_URL_PROD: Joi.string().uri().required(),
  DATABASE_URL_DEV: Joi.string().uri().required(),
  DATABASE_URL_TEST: Joi.string().uri().required(),

  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  SMTP_FROM_EMAIL: Joi.string().email().required(),
  SMTP_FROM_NAME: Joi.string().default("Decomplex Platform"),
}).unknown(true);

const { value: envVars, error } = envSchema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

function resolveDatabaseUrl(nodeEnv: string): string {
  if (nodeEnv === "test") return envVars.DATABASE_URL_TEST;
  if (nodeEnv === "production") return envVars.DATABASE_URL_PROD;
  return envVars.DATABASE_URL_DEV;
}

export const env = {
  nodeEnv: envVars.NODE_ENV as string,
  port: envVars.PORT as number,
  logLevel: envVars.LOG_LEVEL as string,
  logPretty: envVars.LOG_PRETTY as boolean,
  logToFile: envVars.LOG_TO_FILE as boolean,
  logDir: envVars.LOG_DIR as string,
  staticDir: envVars.STATIC_DIR as string,
  staticDefaultFolder: envVars.STATIC_DEFAULT_FOLDER as string,
  uploadMaxFileSizeMb: envVars.UPLOAD_MAX_FILE_SIZE_MB as number,
  jwtSecret: envVars.JWT_SECRET as string,
  jwtExpiresIn: envVars.JWT_EXPIRES_IN as string,
  rabbitMQUrl: envVars.RABBITMQ_URL as string,
  emailQueue: envVars.RABBITMQ_EMAIL_QUEUE as string,
  redisUrl: envVars.REDIS_URL as string,
  rabbitMqUrl: envVars.RABBITMQ_URL as string,
  rabbitMqEmailQueue: envVars.RABBITMQ_EMAIL_QUEUE as string,

  databaseUrl: resolveDatabaseUrl(envVars.NODE_ENV),
};
