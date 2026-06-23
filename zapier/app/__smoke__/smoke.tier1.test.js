// Tier 1 — SAFE live smoke test (default).
//
// Verifies, against the real inTandem API, that: auth works, every webhook trigger
// can subscribe and unsubscribe (self-cleaning), and every dropdown list endpoint
// returns an array. Writes no data. Skips entirely when INTANDEM_SMOKE_TOKEN is unset.
//
// Run:  npm run zapier:smoke   (with a token in zapier/app/.env or the env)
const { App, appTester, authData, TOKEN, hookTriggers, listTriggers } = require('./helpers');

const describeIfToken = TOKEN ? describe : describe.skip;

// A dummy but valid HTTPS target for subscribe; removed immediately by unsubscribe.
const TARGET_URL = 'https://hooks.zapier.com/hooks/smoke-test/intandem';

describeIfToken('Zapier smoke — Tier 1 (safe, live API)', () => {
  test('token is present', () => {
    expect(TOKEN).toBeTruthy();
  });

  test('authentication works', async () => {
    // z.request runs the auth-test request through beforeRequest (Bearer) +
    // afterResponse (throws on >=400), so resolving == a valid token.
    await expect(
      appTester((z) => z.request(App.authentication.test), { authData })
    ).resolves.toBeDefined();
  });

  // Each webhook trigger: subscribe then unsubscribe. "success" = promise resolves
  // (middleware throws on any HTTP error). The subscribe result carries target_url,
  // so feeding it back as subscribeData cleans up the exact subscription.
  if (hookTriggers.length) {
    test.each(hookTriggers)('trigger %s: subscribe + unsubscribe', async (key, trig) => {
      const sub = await appTester(trig.operation.performSubscribe, {
        authData,
        targetUrl: TARGET_URL,
      });
      expect(sub).toBeDefined();
      try {
        await appTester(trig.operation.performUnsubscribe, { authData, subscribeData: sub });
      } catch (e) {
        throw new Error(
          `${key}: unsubscribe failed (possible leaked hook ${TARGET_URL}): ${e.message}`
        );
      }
    });
  }

  // Each dropdown list endpoint returns an array. Do NOT assert non-empty:
  // list_staff / list_matters return [] when business_uid can't resolve.
  if (listTriggers.length) {
    test.each(listTriggers)('dropdown %s: returns an array', async (key, trig) => {
      const rows = await appTester(trig.operation.perform, {
        authData,
        meta: { isFillingDynamicDropdown: true },
      });
      expect(Array.isArray(rows)).toBe(true);
    });
  }
});
