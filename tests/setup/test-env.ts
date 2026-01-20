process.env.NODE_ENV = "test";

process.env.DATABASE_URL_TEST ??= "postgres://test:test@localhost:5432/test";

process.env.ACCESS_TOKEN_SECRET ??= "test-access-secret";
process.env.REFRESH_TOKEN_SECRET ??= "test-refresh-secret";
process.env.JWT_SECRET ??= "test-jwt-secret";

process.env.LOG_TO_FILE = "false";
process.env.LOG_PRETTY = "false";
process.env.LOG_LEVEL = "silent";

process.env.PORT ??= "0";
