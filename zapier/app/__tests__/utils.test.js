const { buildBody, safeJson, unwrapWebhook, toInputField, getByPath } = require('../utils');

describe('getByPath', () => {
  test('resolves a dotted path', () => {
    expect(getByPath({ data: { clients: [1, 2] } }, 'data.clients')).toEqual([1, 2]);
  });
  test('returns undefined for a missing path', () => {
    expect(getByPath({ data: {} }, 'data.clients')).toBeUndefined();
    expect(getByPath(null, 'a.b')).toBeUndefined();
  });
  test('empty path returns the object itself', () => {
    expect(getByPath({ a: 1 }, '')).toEqual({ a: 1 });
  });
});

describe('buildBody', () => {
  test('rebuilds a nested body from dotted field paths', () => {
    const fields = [
      { key: 'invoice__amount', path: ['invoice', 'amount'] },
      { key: 'invoice__note', path: ['invoice', 'note'] },
    ];
    const body = buildBody({ invoice__amount: 100, invoice__note: 'hi' }, fields);
    expect(body).toEqual({ invoice: { amount: 100, note: 'hi' } });
  });

  test('parses JSON fields into real values', () => {
    const fields = [{ key: 'invoice__recipients', path: ['invoice', 'recipients'], isJson: true }];
    const body = buildBody({ invoice__recipients: '["a@b.com"]' }, fields);
    expect(body.invoice.recipients).toEqual(['a@b.com']);
  });

  test('skips undefined / null / empty-string values', () => {
    const fields = [
      { key: 'a', path: ['a'] },
      { key: 'b', path: ['b'] },
      { key: 'c', path: ['c'] },
    ];
    const body = buildBody({ a: '', b: null, c: 'keep' }, fields);
    expect(body).toEqual({ c: 'keep' });
  });

  test('flat field with no explicit path falls back to its key', () => {
    const body = buildBody({ name: 'x' }, [{ key: 'name' }]);
    expect(body).toEqual({ name: 'x' });
  });
});

describe('safeJson', () => {
  test('parses valid JSON strings', () => {
    expect(safeJson('{"a":1}')).toEqual({ a: 1 });
  });
  test('returns the original string when not JSON', () => {
    expect(safeJson('not json')).toBe('not json');
  });
  test('passes non-strings through unchanged', () => {
    expect(safeJson(42)).toBe(42);
  });
});

describe('unwrapWebhook', () => {
  test('unwraps a batched envelope array to data objects', () => {
    const payload = [
      { entity_name: 'client', event_type: 'created', data: { uid: '1' } },
      { entity_name: 'client', event_type: 'created', data: { uid: '2' } },
    ];
    expect(unwrapWebhook(payload)).toEqual([{ uid: '1' }, { uid: '2' }]);
  });
  test('handles a single (non-array) envelope', () => {
    expect(unwrapWebhook({ data: { uid: '9' } })).toEqual([{ uid: '9' }]);
  });
  test('falls back to the item itself when there is no data wrapper', () => {
    expect(unwrapWebhook([{ uid: 'raw' }])).toEqual([{ uid: 'raw' }]);
  });
});

describe('toInputField', () => {
  test('drops internal keys (path, isJson) and keeps Zapier-valid shape', () => {
    const out = toInputField({
      key: 'invoice__amount',
      path: ['invoice', 'amount'],
      isJson: false,
      label: 'Amount',
      type: 'number',
      required: true,
      helpText: 'the amount',
    });
    expect(out).toEqual({
      key: 'invoice__amount',
      label: 'Amount',
      type: 'number',
      required: true,
      helpText: 'the amount',
    });
  });
  test('omits falsy optional keys', () => {
    const out = toInputField({ key: 'x', label: 'X', type: 'string', required: false });
    expect(out).toEqual({ key: 'x', label: 'X', type: 'string' });
  });
  test('passes through a dynamic dropdown reference', () => {
    const out = toInputField({ key: 'client_id', label: 'Client Id', type: 'string', dynamic: 'list_clients.id.label' });
    expect(out.dynamic).toBe('list_clients.id.label');
  });
});
