import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(4000),
  DATABASE_URL: Joi.string().uri().required(),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
  LOG_PRETTY: Joi.boolean().default(true),
  LOG_TO_FILE: Joi.boolean().default(false),
  LOG_DIR: Joi.string().default('logs'),
}).unknown(true);

const { value: envVars, error } = envSchema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const env = {
  nodeEnv: envVars.NODE_ENV as string,
  port: envVars.PORT as number,
  databaseUrl: envVars.DATABASE_URL as string,
  logLevel: envVars.LOG_LEVEL as string,
  logPretty: envVars.LOG_PRETTY as boolean,
  logToFile: envVars.LOG_TO_FILE as boolean,
  logDir: envVars.LOG_DIR as string,
};
