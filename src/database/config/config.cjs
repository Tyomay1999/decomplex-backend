require("dotenv").config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}

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
    url: requireEnv("DATABASE_URL_PROD"),
    dialect: "postgres",
  },
};
