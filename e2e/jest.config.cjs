module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/suites/**/*.e2e.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 20000,
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/suites/lb/"],
  setupFiles: ["<rootDir>/helpers/jestEnv.ts"],
  globalSetup: "<rootDir>/setup/globalSetup.ts",
  globalTeardown: "<rootDir>/setup/globalTeardown.ts",
};
