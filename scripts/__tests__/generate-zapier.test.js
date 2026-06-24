const gen = require('../generate-zapier');

describe('generate-zapier exposes pure helpers (testable, no side effects on require)', () => {
  test('exports the pure functions under test', () => {
    expect(typeof gen.zapierType).toBe('function');
    expect(typeof gen.sanitizeKey).toBe('function');
    expect(typeof gen.deref).toBe('function');
    expect(typeof gen.walkSchema).toBe('function');
    expect(typeof gen.outputFieldsFromSample).toBe('function');
    expect(typeof gen.titleCaseEvent).toBe('function');
  });
});

describe('dropdownRef (D004 — dynamic dropdown wiring)', () => {
  const byLeaf = { client_id: 'clients', from_estimate_uid: 'estimates' };
  test('builds list_<key>.id.label for a matching leaf (incl. dotted keys)', () => {
    expect(gen.dropdownRef('client_id', byLeaf)).toBe('list_clients.id.label');
    expect(gen.dropdownRef('invoice__from_estimate_uid', byLeaf)).toBe('list_estimates.id.label');
  });
  test('returns undefined when the leaf is not a dropdown', () => {
    expect(gen.dropdownRef('amount', byLeaf)).toBeUndefined();
    expect(gen.dropdownRef('invoice__total', byLeaf)).toBeUndefined();
  });
  test('matches a full dotted key (so generic leaves like "uid" can be targeted precisely)', () => {
    const map = { category__uid: 'service_categories' };
    expect(gen.dropdownRef('category__uid', map)).toBe('list_service_categories.id.label');
    // a different field ending in the generic "uid" leaf must NOT match
    expect(gen.dropdownRef('other__uid', map)).toBeUndefined();
  });
});

describe('emitCreate client_matter resolution (D030 — pick a Client, resolve its matter)', () => {
  const vm = require('vm');
  const loadCreate = (create, fields, { matters = [{ uid: 'matter-1' }] } = {}) => {
    const src = gen.emitCreate(create, fields, [], { uid: 'sample' });
    const requests = [];
    const fakeRequire = (name) => {
      if (name === '../constants') return { BASE_URL: 'https://api.test' };
      if (name === '../utils') return require('../../zapier/app/utils');
      throw new Error(`unexpected require: ${name}`);
    };
    const module = { exports: {} };
    vm.runInNewContext(src, { require: fakeRequire, module, exports: module.exports });
    const z = {
      request: async (opts) => {
        requests.push(opts);
        // client-detail GET (matter resolution) vs the create POST
        if (opts.method === 'GET') return { data: { data: { client: { matters } } } };
        return { data: { ok: true } };
      },
    };
    return { def: module.exports, z, requests };
  };

  const clientNoteFields = [
    { key: 'matter_uid', path: ['matter_uid'], label: 'Matter Uid', type: 'string', required: true, isJson: false, dynamic: 'list_matters.id.label' },
    { key: 'content', path: ['content'], label: 'Content', type: 'string', required: true, isJson: false },
  ];

  test('exposes a Client input field (not matter_uid) backed by the clients dropdown', () => {
    const { def } = loadCreate({ key: 'client_note', noun: 'Client Note', label: 'Create Client Note', path: '/x', method: 'POST', client_matter: true }, clientNoteFields);
    const keys = def.operation.inputFields.map((f) => f.key);
    expect(keys).toContain('client_id');
    expect(keys).not.toContain('matter_uid');
    const client = def.operation.inputFields.find((f) => f.key === 'client_id');
    expect(client.dynamic).toBe('list_clients.id.label');
    expect(client.label).toBe('Client');
    expect(client.required).toBe(true);
  });

  test('perform resolves matter from the chosen client and injects it into the body (top-level)', async () => {
    const { def, z, requests } = loadCreate(
      { key: 'client_note', noun: 'Client Note', label: 'Create Client Note', path: '/x', method: 'POST', client_matter: true },
      clientNoteFields,
      { matters: [{ uid: 'matter-77' }] }
    );
    await def.operation.perform(z, { inputData: { client_id: 'client-5', content: 'hi' } });
    const post = requests.find((r) => r.method === 'POST');
    expect(post.body).toEqual({ content: 'hi', matter_uid: 'matter-77' });
  });

  test('injects matter at a nested path (invoice.matter_uid) and keeps client_id out of the body', async () => {
    const invoiceFields = [
      { key: 'invoice__matter_uid', path: ['invoice', 'matter_uid'], label: 'Matter Uid', type: 'string', required: true, isJson: false, dynamic: 'list_matters.id.label' },
      { key: 'invoice__currency', path: ['invoice', 'currency'], label: 'Currency', type: 'string', required: false, isJson: false },
    ];
    const { def, z, requests } = loadCreate(
      { key: 'invoice', noun: 'Invoice', label: 'Create Invoice', path: '/i', method: 'POST', client_matter: true },
      invoiceFields,
      { matters: [{ uid: 'matter-88' }] }
    );
    await def.operation.perform(z, { inputData: { client_id: 'client-9', invoice__currency: 'USD' } });
    const post = requests.find((r) => r.method === 'POST');
    expect(post.body).toEqual({ invoice: { currency: 'USD', matter_uid: 'matter-88' } });
  });

  test('reuses an existing client_id body field as the matter source (no duplicate), keeps client_id in the body', async () => {
    // Generic capability: a create that has a native client_id AND a matter_uid.
    // (No current create wires this; booking deliberately does not use client_matter.)
    const nativeClientFields = [
      { key: 'client_id', path: ['client_id'], label: 'Client Id', type: 'string', required: false, isJson: false, dynamic: 'list_clients.id.label' },
      { key: 'matter_uid', path: ['matter_uid'], label: 'Matter Uid', type: 'string', required: false, isJson: false },
      { key: 'service_id', path: ['service_id'], label: 'Service Id', type: 'string', required: false, isJson: false },
    ];
    const { def, z, requests } = loadCreate(
      { key: 'thing', noun: 'Thing', label: 'Create Thing', path: '/b', method: 'POST', client_matter: true },
      nativeClientFields,
      { matters: [{ uid: 'matter-55' }] }
    );
    const keys = def.operation.inputFields.map((f) => f.key);
    // exactly one client_id, and matter_uid is no longer a user-facing field
    expect(keys.filter((k) => k === 'client_id')).toHaveLength(1);
    expect(keys).not.toContain('matter_uid');
    await def.operation.perform(z, { inputData: { client_id: 'client-3', service_id: 'svc-1' } });
    const post = requests.find((r) => r.method === 'POST');
    // client_id stays in the body (API wants it) AND matter_uid is resolved from it
    expect(post.body).toEqual({ client_id: 'client-3', service_id: 'svc-1', matter_uid: 'matter-55' });
  });

  test('wrap_array + body_const: wraps the built body in an array and merges constants at top level', async () => {
    const fields = [
      { key: 'client_id', path: ['client_id'], label: 'Client', type: 'string', required: true, isJson: false },
      { key: 'title', path: ['title'], label: 'Title', type: 'string', required: true, isJson: false },
    ];
    const { def, z, requests } = loadCreate(
      { key: 'booking', noun: 'Appointment', label: 'Create Booking', path: '/a', method: 'POST', wrap_array: 'appointments', body_const: { new_api: true } },
      fields
    );
    await def.operation.perform(z, { inputData: { client_id: 'c1', title: 'Hi' } });
    const post = requests.find((r) => r.method === 'POST');
    expect(post.body).toEqual({ appointments: [{ client_id: 'c1', title: 'Hi' }], new_api: true });
  });

  test('without client_matter, fields are unchanged (matter_uid stays a body field)', () => {
    const { def } = loadCreate({ key: 'x', noun: 'X', label: 'Create X', path: '/x', method: 'POST' }, clientNoteFields);
    const keys = def.operation.inputFields.map((f) => f.key);
    expect(keys).toContain('matter_uid');
    expect(keys).not.toContain('client_id');
  });
});

describe('emitListTrigger query param resolution (D029 — {business_uid} in query)', () => {
  const vm = require('vm');
  // Load the emitted list-trigger source in a sandbox with stubbed deps so we can
  // exercise its perform() without touching the real app/network.
  const loadPerform = (dd, { resolvedBiz = 'biz-xyz' } = {}) => {
    const src = gen.emitListTrigger(dd);
    const requests = [];
    const fakeRequire = (name) => {
      if (name === '../constants') return { BASE_URL: 'https://api.test' };
      if (name === '../utils') {
        return {
          getByPath: (obj, p) => (p ? p.split('.').reduce((n, k) => (n == null ? undefined : n[k]), obj) : obj),
          resolveBusinessUid: async () => resolvedBiz,
        };
      }
      throw new Error(`unexpected require: ${name}`);
    };
    const module = { exports: {} };
    vm.runInNewContext(src, {
      require: fakeRequire,
      module,
      exports: module.exports,
    });
    const z = { request: async (opts) => { requests.push(opts); return { data: { data: { rows: [] } } }; } };
    return { perform: module.exports.operation.perform, z, requests };
  };

  test('substitutes {business_uid} in a query param with the resolved business uid', async () => {
    const dd = {
      key: 'services', noun: 'Service', path: '/platform/v1/services',
      array_path: 'data.rows', id_field: 'id', label_fields: ['name'],
      query: { business_id: '{business_uid}' },
    };
    const { perform, z, requests } = loadPerform(dd, { resolvedBiz: 'biz-xyz' });
    await perform(z, { authData: {} });
    expect(requests).toHaveLength(1);
    expect(requests[0].params.business_id).toBe('biz-xyz');
  });

  test('returns [] (no request) when business_uid placeholder cannot be resolved', async () => {
    const dd = {
      key: 'services', noun: 'Service', path: '/platform/v1/services',
      array_path: 'data.rows', id_field: 'id', label_fields: ['name'],
      query: { business_id: '{business_uid}' },
    };
    const { perform, z, requests } = loadPerform(dd, { resolvedBiz: null });
    await expect(perform(z, { authData: {} })).resolves.toEqual([]);
    expect(requests).toHaveLength(0);
  });

  test('leaves literal query params untouched', async () => {
    const dd = {
      key: 'matters', noun: 'Matter', path: '/v2/search',
      array_path: 'data.matters', id_field: 'matter_uid', label_fields: ['matter_name'],
      query: { entity: 'client', per_page: 25 },
    };
    const { perform, z, requests } = loadPerform(dd);
    await perform(z, { authData: {} });
    expect(requests[0].params).toEqual({ entity: 'client', per_page: 25 });
  });
});

describe('titleCaseEvent (D018 — title-cased trigger labels)', () => {
  test('title-cases each segment of entity/event_type, preserving / and _', () => {
    expect(gen.titleCaseEvent('client/updated')).toBe('Client/Updated');
    expect(gen.titleCaseEvent('appointment/reminder_sent')).toBe('Appointment/Reminder_Sent');
    expect(gen.titleCaseEvent('payment/recorded')).toBe('Payment/Recorded');
  });
});

describe('makeField redundant helpText (D011)', () => {
  const ctx = ['address'];
  test('omits helpText when the description just repeats the label', () => {
    const f = gen.makeField(ctx, { type: 'string', description: 'Address' }, false, false);
    expect(f.label).toBe('Address');
    expect(f.helpText).toBeUndefined();
  });
  test('keeps helpText when it adds real information', () => {
    const f = gen.makeField(ctx, { type: 'string', description: 'Full street address incl. zip' }, false, false);
    expect(f.helpText).toBe('Full street address incl. zip');
  });
});

describe('outputFieldsFromSample type handling (D024)', () => {
  test('skips object/array values entirely (Zapier defaults untyped to string -> mismatch)', () => {
    const out = gen.outputFieldsFromSample({ addr: { x: 1 }, items: [1, 2], name: 's', n: 3, b: true });
    const by = Object.fromEntries(out.map((f) => [f.key, f]));
    expect(by.addr).toBeUndefined();
    expect(by.items).toBeUndefined();
    expect(by.name.type).toBe('string');
    expect(by.n.type).toBe('number');
    expect(by.b.type).toBe('boolean');
  });
  test('keeps null/scalar fields (null treated as string)', () => {
    const out = gen.outputFieldsFromSample({ note: null, id: 'x' });
    expect(out.map((f) => f.key).sort()).toEqual(['id', 'note']);
  });
});

describe('isValidEvent (robust to entity-only OR full entity/event_type enums)', () => {
  test('full-form enum: accepts an exact entity/event_type match', () => {
    expect(gen.isValidEvent('client/created', ['client/created', 'invoice/issued'])).toBe(true);
  });
  test('full-form enum: rejects an event not listed', () => {
    expect(gen.isValidEvent('client/deleted', ['client/created', 'invoice/issued'])).toBe(false);
  });
  test('legacy entity-only enum: accepts when the entity prefix is listed', () => {
    expect(gen.isValidEvent('client/created', ['client', 'invoice'])).toBe(true);
  });
  test('legacy entity-only enum: rejects an unknown entity', () => {
    expect(gen.isValidEvent('widget/created', ['client', 'invoice'])).toBe(false);
  });
});

describe('zapierType', () => {
  test('maps date/date-time strings to datetime', () => {
    expect(gen.zapierType({ type: 'string', format: 'date-time' })).toBe('datetime');
    expect(gen.zapierType({ type: 'string', format: 'date' })).toBe('datetime');
  });
  test('maps integer/number to number', () => {
    expect(gen.zapierType({ type: 'integer' })).toBe('number');
    expect(gen.zapierType({ type: 'number' })).toBe('number');
  });
  test('maps boolean to boolean', () => {
    expect(gen.zapierType({ type: 'boolean' })).toBe('boolean');
  });
  test('defaults to string', () => {
    expect(gen.zapierType({ type: 'string' })).toBe('string');
    expect(gen.zapierType({})).toBe('string');
  });
});

describe('sanitizeKey', () => {
  test('turns an event into a valid Zapier key', () => {
    expect(gen.sanitizeKey('client/created')).toBe('client_created');
    expect(gen.sanitizeKey('appointment/cancelled')).toBe('appointment_cancelled');
  });
  test('strips leading/trailing separators', () => {
    expect(gen.sanitizeKey('/foo/')).toBe('foo');
  });
});

describe('deref', () => {
  const spec = {
    components: { schemas: { Thing: { type: 'object', properties: { a: { type: 'string' } } } } },
  };
  test('resolves a local $ref', () => {
    const out = gen.deref({ $ref: '#/components/schemas/Thing' }, spec);
    expect(out.properties.a.type).toBe('string');
  });
  test('returns {} for an external $ref (opaque)', () => {
    expect(gen.deref({ $ref: 'https://example.com/x.json' }, spec)).toEqual({});
  });
});

describe('walkSchema', () => {
  const ctx = () => ({ path: [], depth: 0, parentRequired: true });

  test('flat schema -> one field per property, required propagated', () => {
    const schema = {
      type: 'object',
      required: ['first_name'],
      properties: { first_name: { type: 'string' }, email: { type: 'string', format: 'email' } },
    };
    const fields = gen.walkSchema(schema, {}, ctx());
    const byKey = Object.fromEntries(fields.map((f) => [f.key, f]));
    expect(Object.keys(byKey).sort()).toEqual(['email', 'first_name']);
    expect(byKey.first_name.required).toBe(true);
    expect(byKey.email.required).toBe(false);
  });

  test('wrapped object -> dotted key + path for runtime rebuild', () => {
    const schema = {
      type: 'object',
      required: ['invoice'],
      properties: {
        invoice: {
          type: 'object',
          required: ['amount'],
          properties: { amount: { type: 'number' }, note: { type: 'string' } },
        },
      },
    };
    const fields = gen.walkSchema(schema, {}, ctx());
    const amount = fields.find((f) => f.key === 'invoice__amount');
    expect(amount).toBeTruthy();
    expect(amount.path).toEqual(['invoice', 'amount']);
    expect(amount.type).toBe('number');
    expect(amount.required).toBe(true); // both wrapper and leaf required
  });

  test('arrays become JSON text fields', () => {
    const schema = {
      type: 'object',
      properties: { recipients: { type: 'array', items: { type: 'string' } } },
    };
    const [f] = gen.walkSchema(schema, {}, ctx());
    expect(f.type).toBe('text');
    expect(f.isJson).toBe(true);
  });

  test('readOnly properties are skipped', () => {
    const schema = {
      type: 'object',
      properties: { uid: { type: 'string', readOnly: true }, name: { type: 'string' } },
    };
    const fields = gen.walkSchema(schema, {}, ctx());
    expect(fields.map((f) => f.key)).toEqual(['name']);
  });

  test('resolves $ref body schemas', () => {
    const spec = {
      components: {
        schemas: {
          CreateThing: { type: 'object', required: ['title'], properties: { title: { type: 'string' } } },
        },
      },
    };
    const fields = gen.walkSchema({ $ref: '#/components/schemas/CreateThing' }, spec, ctx());
    expect(fields).toHaveLength(1);
    expect(fields[0].key).toBe('title');
    expect(fields[0].required).toBe(true);
  });
});

describe('outputFieldsFromSample', () => {
  test('derives typed output fields from a sample data object', () => {
    const out = gen.outputFieldsFromSample({ id: 'x', count: 3, active: true });
    const byKey = Object.fromEntries(out.map((f) => [f.key, f.type]));
    expect(byKey).toEqual({ id: 'string', count: 'number', active: 'boolean' });
  });
  test('handles empty/non-object safely', () => {
    expect(gen.outputFieldsFromSample(null)).toEqual([]);
  });
});
