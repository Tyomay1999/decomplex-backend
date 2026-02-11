import dotenv from "dotenv";
import Joi from "joi";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env" });

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

  DEFAULT_LOCALE: Joi.string().valid("hy", "ru", "en").default("en"),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default("1d"),

  ACCESS_TOKEN_SECRET: Joi.string().default("dev_access_secret"),
  REFRESH_TOKEN_SECRET: Joi.string().default("dev_refresh_secret"),

  REDIS_ENABLED: Joi.boolean().default(false),
  REDIS_URL: Joi.string()
    .uri()
    .when("REDIS_ENABLED", {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional().allow(""),
    }),

  RABBITMQ_ENABLED: Joi.boolean().default(false),
  RABBITMQ_URL: Joi.string()
    .uri()
    .when("RABBITMQ_ENABLED", {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional().allow(""),
    }),
  RABBITMQ_EMAIL_QUEUE: Joi.string().default("email_queue"),

  DATABASE_URL: Joi.string().uri().optional(),

  DATABASE_URL_PROD: Joi.string().uri().optional(),
  DATABASE_URL_DEV: Joi.string().uri().optional(),
  DATABASE_URL_TEST: Joi.string().uri().optional(),

  SMTP_HOST: Joi.string().when("RABBITMQ_ENABLED", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional().allow(""),
  }),
  SMTP_USER: Joi.string().when("RABBITMQ_ENABLED", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional().allow(""),
  }),
  SMTP_PASS: Joi.string().when("RABBITMQ_ENABLED", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional().allow(""),
  }),
  SMTP_FROM_EMAIL: Joi.string()
    .email()
    .when("RABBITMQ_ENABLED", {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional().allow(""),
    }),

  SMTP_PORT: Joi.number().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_FROM_NAME: Joi.string().default("Decomplex Platform"),

  DB_SSL_ENABLED: Joi.boolean().default(false),
  DB_SSL_REJECT_UNAUTHORIZED: Joi.boolean().default(false),
}).unknown(true);

const { value: envVars, error } = envSchema.validate(process.env, {
  abortEarly: false,
  convert: true,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

function resolveDatabaseUrl(nodeEnv: string): string {
  if (nodeEnv === "test") return envVars.DATABASE_URL_TEST || "";
  if (nodeEnv === "production") return envVars.DATABASE_URL || envVars.DATABASE_URL_PROD || "";
  return envVars.DATABASE_URL_DEV || "";
}

const databaseUrl = resolveDatabaseUrl(envVars.NODE_ENV);

if (!databaseUrl) {
  throw new Error(
    `DATABASE_URL is missing for NODE_ENV=${envVars.NODE_ENV}. Provide DATABASE_URL (Render) or DATABASE_URL_PROD/DEV/TEST.`,
  );
}

export const env = {
  nodeEnv: envVars.NODE_ENV as string,
  port: envVars.PORT as number,
  logLevel: envVars.LOG_LEVEL as string,
  logPretty: envVars.LOG_PRETTY as boolean,
  logToFile: envVars.LOG_TO_FILE as boolean,
  logDir: envVars.LOG_DIR as string,
  defaultLocale: envVars.DEFAULT_LOCALE as string,
  staticDir: envVars.STATIC_DIR as string,
  staticDefaultFolder: envVars.STATIC_DEFAULT_FOLDER as string,
  uploadMaxFileSizeMb: envVars.UPLOAD_MAX_FILE_SIZE_MB as number,
  jwtSecret: envVars.JWT_SECRET as string,
  jwtExpiresIn: envVars.JWT_EXPIRES_IN as string,
  accessTokenSecret: envVars.ACCESS_TOKEN_SECRET as string,
  refreshTokenSecret: envVars.REFRESH_TOKEN_SECRET as string,

  redisEnabled: envVars.REDIS_ENABLED as boolean,
  redisUrl: envVars.REDIS_URL as string,

  rabbitMqEnabled: envVars.RABBITMQ_ENABLED as boolean,
  rabbitMQUrl: envVars.RABBITMQ_URL as string,
  rabbitMqEmailQueue: envVars.RABBITMQ_EMAIL_QUEUE as string,

  smtpHost: envVars.SMTP_HOST as string,
  smtpPort: envVars.SMTP_PORT as number,
  smtpSecure: envVars.SMTP_SECURE as boolean,
  smtpUser: envVars.SMTP_USER as string,
  smtpPass: envVars.SMTP_PASS as string,
  smtpFromName: envVars.SMTP_FROM_NAME as string,
  smtpFromEmail: envVars.SMTP_FROM_EMAIL as string,

  databaseUrl: resolveDatabaseUrl(envVars.NODE_ENV),
  dbSslEnabled: envVars.DB_SSL_ENABLED as boolean,
  dbSslRejectUnauthorized: envVars.DB_SSL_REJECT_UNAUTHORIZED as boolean,
};
