require("dotenv").config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is not set`);
  return value;
}

function toBool(value, fallback) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
}

const dbSslEnabled = toBool(process.env.DB_SSL_ENABLED, false);
const dbSslRejectUnauthorized = toBool(process.env.DB_SSL_REJECT_UNAUTHORIZED, false);

const productionDialectOptions = dbSslEnabled
  ? { ssl: { require: true, rejectUnauthorized: dbSslRejectUnauthorized } }
  : undefined;

module.exports = {
  development: {
    url: requireEnv("DATABASE_URL_DEV"),
    dialect: "postgres",
  },
  test: {
    url: requireEnv("DATABASE_URL_TEST"),
    dialect: "postgres",
  },
  production: {
    url: requireEnv("DATABASE_URL"),
    dialect: "postgres",
    ...(productionDialectOptions ? { dialectOptions: productionDialectOptions } : {}),
  },
};
