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
