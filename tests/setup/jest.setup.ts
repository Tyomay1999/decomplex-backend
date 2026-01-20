jest.mock("../../src/lib/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  httpLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../src/config/env", () => ({
  env: {
    nodeEnv: "test",
    port: 0,

    logLevel: "silent",
    logPretty: false,
    logToFile: false,
    logDir: "logs",

    defaultLocale: "en",
    staticDir: "static",
    staticDefaultFolder: "images",
    uploadMaxFileSizeMb: 10,

    jwtSecret: "test-jwt-secret",
    jwtExpiresIn: "1d",
    accessTokenSecret: "test-access-secret",
    refreshTokenSecret: "test-refresh-secret",

    redisEnabled: false,
    redisUrl: "",

    rabbitMqEnabled: false,
    rabbitMQUrl: "",
    rabbitMqEmailQueue: "email_queue",

    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    smtpPass: "",
    smtpFromName: "Decomplex Platform",
    smtpFromEmail: "",

    databaseUrl: "postgres://test:test@localhost:5432/test",
  },
}));
