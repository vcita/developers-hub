// Shared bootstrap for the live smoke tests.
//
// Provides a zapier-platform-core appTester bound to the real app, the auth data
// (token from env / .env), the opt-in flags, and helpers to classify triggers and
// source foreign IDs. Reads INTANDEM_SMOKE_TOKEN from the environment OR from
// zapier/app/.env (so it works both locally and with CI secrets). When the token
// is absent, TOKEN is undefined and the suites skip themselves.
const fs = require('fs');
const path = require('path');
const { createAppTester } = require('zapier-platform-core');

// Load zapier/app/.env without overriding real env vars (CI secrets win).
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  }
}

const App = require('../index');
const appTester = createAppTester(App);

const TOKEN = process.env.INTANDEM_SMOKE_TOKEN;
const RUN_CREATES = process.env.INTANDEM_SMOKE_CREATES === '1';
const SANDBOX_UID = process.env.INTANDEM_SMOKE_BUSINESS_UID || null;
const authData = { api_token: TOKEN };

// A REST-hook trigger has performSubscribe; a dropdown list trigger has only perform.
const triggerEntries = Object.entries(App.triggers);
const hookTriggers = triggerEntries.filter(
  ([, t]) => typeof t.operation.performSubscribe === 'function'
);
const listTriggers = triggerEntries.filter(
  ([, t]) =>
    typeof t.operation.performSubscribe !== 'function' &&
    typeof t.operation.perform === 'function'
);

// Run a dropdown list trigger and return the first item's id (or undefined).
const sourceId = async (listKey) => {
  const trig = App.triggers[listKey];
  if (!trig) return undefined;
  try {
    const rows = await appTester(trig.operation.perform, {
      authData,
      meta: { isFillingDynamicDropdown: true },
    });
    return Array.isArray(rows) && rows[0] ? rows[0].id : undefined;
  } catch (e) {
    return undefined;
  }
};

module.exports = {
  App,
  appTester,
  authData,
  TOKEN,
  RUN_CREATES,
  SANDBOX_UID,
  hookTriggers,
  listTriggers,
  sourceId,
};
