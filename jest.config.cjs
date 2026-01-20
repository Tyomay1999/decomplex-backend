module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/tests/**/*.test.ts",
    "<rootDir>/src/modules/**/__tests__/**/*.test.ts",
    "<rootDir>/src/middleware/**/__tests__/**/*.test.ts",
    "<rootDir>/src/services/**/__tests__/**/*.test.ts",
  ],
  setupFiles: ["<rootDir>/tests/setup/test-env.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.ts"],
  clearMocks: true,
  restoreMocks: true,
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
};
