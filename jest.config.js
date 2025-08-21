module.exports = {
  testEnvironment: "node",
  collectCoverageFrom: ["src/**/*.js", "!src/index.js"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  testMatch: ["**/tests/**/*.test.js"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
