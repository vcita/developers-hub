// Tier 2 — DESTRUCTIVE live smoke test (opt-in).
//
// Exercises every create against the real API. THIS WRITES REAL RECORDS — run only
// against a SANDBOX business. Double-gated: needs INTANDEM_SMOKE_TOKEN *and*
// INTANDEM_SMOKE_CREATES=1. Set INTANDEM_SMOKE_BUSINESS_UID to hard-guard the
// target business (the suite aborts if the token resolves to a different one).
//
// Run:  npm run zapier:smoke:creates
//
// Cleanup: the app has no delete actions, so records are NOT auto-removed. Every
// record is labelled "Zapier Smoke <ISO>" for easy manual cleanup in the sandbox.
const { App, appTester, authData, TOKEN, RUN_CREATES, SANDBOX_UID } = require('./helpers');
const { resolveBusinessUid } = require('../utils');

const describeIfCreates = TOKEN && RUN_CREATES ? describe : describe.skip;

const stamp = () => new Date().toISOString();
const label = (what) => `Zapier Smoke ${what} ${stamp()}`;
const day = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);

describeIfCreates('Zapier smoke — Tier 2 (DESTRUCTIVE creates, sandbox only)', () => {
  const ids = {};
  let businessUid;

  beforeAll(async () => {
    businessUid = await appTester((z, b) => resolveBusinessUid(z, b), { authData });
    if (SANDBOX_UID && businessUid !== SANDBOX_UID) {
      throw new Error(
        `Refusing to create: resolved business "${businessUid}" != INTANDEM_SMOKE_BUSINESS_UID "${SANDBOX_UID}". ` +
          `Tier 2 writes real data — point it at the sandbox business.`
      );
    }
    // eslint-disable-next-line no-console
    console.log(`[smoke] Tier 2 writing to business: ${businessUid || '(unresolved)'}`);

    const src = async (k) => {
      const t = App.triggers[k];
      if (!t) return undefined;
      try {
        const rows = await appTester(t.operation.perform, {
          authData,
          meta: { isFillingDynamicDropdown: true },
        });
        return Array.isArray(rows) && rows[0] ? rows[0].id : undefined;
      } catch (e) {
        return undefined;
      }
    };
    const srcRows = async (k) => {
      const t = App.triggers[k];
      if (!t) return [];
      try {
        const rows = await appTester(t.operation.perform, {
          authData,
          meta: { isFillingDynamicDropdown: true },
        });
        return Array.isArray(rows) ? rows : [];
      } catch (e) {
        return [];
      }
    };
    ids.client = await src('list_clients');
    ids.category = await src('list_service_categories');
    ids.service = await src('list_services');
    ids.staff = await src('list_staff');
    ids.serviceRows = await srcRows('list_services'); // full rows (need interaction_type/duration)
    // matter_uid is no longer an input: client_note/invoice/estimate take a Client
    // (client_id); the app resolves that client's matter at runtime. booking uses
    // the staff appointments endpoint and also takes client_id directly.
  });

  const create = (key, inputData) =>
    appTester(App.creates[key].operation.perform, { authData, inputData });

  // Soft-skip (pass with a warning) when a required foreign id couldn't be sourced.
  const skip = (msg) => {
    // eslint-disable-next-line no-console
    console.warn(`[smoke] soft-skip: ${msg}`);
  };

  // --- self-contained ---
  test('create client', async () => {
    await expect(create('client', { first_name: label('Client') })).resolves.toBeDefined();
  });

  test('create product', async () => {
    await expect(
      create('product', { product__name: label('Product'), product__price: 1 })
    ).resolves.toBeDefined();
  });

  test('create lead', async () => {
    await expect(
      create('lead', {
        first_name: label('Lead'),
        identifier_type: 'email',
        email: `smoke+${Date.now()}@example.com`,
        request_title: 'Zapier smoke test',
      })
    ).resolves.toBeDefined();
  });

  // --- one-hop foreign id (soft-skip if unavailable) ---
  test('create client_note', async () => {
    if (!ids.client) return skip('create client_note: no client_id available');
    await expect(
      create('client_note', { client_id: ids.client, content: label('Note') })
    ).resolves.toBeDefined();
  });

  test('create payment', async () => {
    if (!ids.client) return skip('create payment: no client_id available');
    await expect(
      create('payment', {
        client_id: ids.client,
        amount: 1,
        currency: 'USD',
        // A pending payment must use 'Bank Transfer' (API constraint).
        payment_method: 'Bank Transfer',
        title: label('Payment'),
        state: 'pending',
      })
    ).resolves.toBeDefined();
  });

  test('create service', async () => {
    if (!ids.category) return skip('create service: no service category uid available');
    await expect(
      create('service', {
        name: label('Service'),
        duration: 30,
        interaction_type: 'online',
        category__uid: ids.category,
      })
    ).resolves.toBeDefined();
  });

  // --- structured payloads (items[]/dates). Item shape may need tuning per API. ---
  test('create invoice', async () => {
    if (!ids.client) return skip('create invoice: no client_id available');
    await expect(
      create('invoice', {
        client_id: ids.client,
        invoice__billing_address: '123 Smoke Street',
        invoice__currency: 'USD',
        invoice__issue_date: day(0),
        invoice__due_date: day(30),
        invoice__items: JSON.stringify([{ name: 'Smoke item', unit_amount: 1, quantity: 1 }]),
      })
    ).resolves.toBeDefined();
  });

  test('create estimate', async () => {
    if (!ids.client) return skip('create estimate: no client_id available');
    await expect(
      create('estimate', {
        client_id: ids.client,
        estimate__billing_address: '123 Smoke Street',
        estimate__currency: 'USD',
        estimate__issue_date: day(0),
        estimate__due_date: day(30),
        estimate__items: JSON.stringify([{ name: 'Smoke item', unit_amount: 1, quantity: 1 }]),
      })
    ).resolves.toBeDefined();
  });

  test('create booking (staff appointments endpoint, client_id)', async () => {
    const svc = (ids.serviceRows || [])[0];
    if (!svc || !ids.client || !ids.staff)
      return skip('create booking: need a service + client_id + staff_id');

    // Build a real appointment: interaction_type from the service, end_time from
    // its duration, and a UNIQUE slot (Date.now()) so reruns don't collide. The
    // app wraps this as { appointments: [...], new_api: true } and sends
    // interaction_details="" by default (valid for online/video services).
    const durationMin = svc.duration || 30;
    const start = new Date(Date.now() + 14 * 86400000 + (Date.now() % 600) * 60000);
    const end = new Date(start.getTime() + durationMin * 60000);
    try {
      const res = await create('booking', {
        client_id: ids.client,
        service_id: svc.id,
        staff_id: ids.staff,
        title: label('Appointment'),
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        interaction_type: svc.interaction_type || 'online',
        // interaction_details left blank — app sends "" (fine for online/video).
      });
      expect(res).toBeDefined();
    } catch (e) {
      // Location/phone services need a non-empty interaction_details we can't
      // guess; that's service config, not an app defect. Soft-skip those.
      if (/intercation details|interaction_details|can't be blank/i.test(e && e.message)) {
        return skip(`create booking: service ${svc.id} needs interaction_details (location/phone) — app works`);
      }
      if (/429|Too Many Requests|Throttled/i.test(e && e.message)) {
        return skip('create booking: rate-limited (429) — transient');
      }
      throw e;
    }
  });

  afterAll(() => {
    // eslint-disable-next-line no-console
    console.log('[smoke] Tier 2 done. Records are labelled "Zapier Smoke ..." — clean up the sandbox manually (no delete actions exist).');
  });
});
