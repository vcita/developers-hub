// Jest config scoped to the Zapier integration work only (keeps it isolated
// from api-validation and any other repo tests). Run via `npm run test:zapier`.
module.exports = {
  rootDir: '..',
  testMatch: [
    '<rootDir>/scripts/__tests__/**/*.test.js',
    '<rootDir>/zapier-app/__tests__/**/*.test.js',
  ],
  testPathIgnorePatterns: ['/node_modules/'],
};
