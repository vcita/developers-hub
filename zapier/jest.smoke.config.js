// Jest config for the LIVE smoke tests (zapier/app/__smoke__). Kept separate from
// jest.config.js so `npm run test:zapier` never runs these — smoke tests hit the
// real inTandem API and require a token. Run via `npm run zapier:smoke`.
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/zapier/app/__smoke__/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  testTimeout: 60000, // live HTTP; Tier-2 creates chain several calls
};
