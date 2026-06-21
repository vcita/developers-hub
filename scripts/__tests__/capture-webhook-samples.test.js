const cap = require('../capture-webhook-samples');

const fence = (obj) => '```json\n' + JSON.stringify(obj, null, 2) + '\n```';

describe('extractPayloads (from readme_sync webhook-response markdown)', () => {
  test('extracts the {entity_name,event_type,data} envelope from a json fence', () => {
    const md = [
      '## subscribe example',
      '```curl',
      "curl ... --data-raw '{ \"event\": \"deposit/created\" }'",
      '```',
      '## payload example',
      fence({ entity_name: 'deposit', event_type: 'created', data: { uid: '1' } }),
    ].join('\n');
    expect(cap.extractPayloads(md)).toEqual([
      { entity_name: 'deposit', event_type: 'created', data: { uid: '1' } },
    ]);
  });

  test('extracts multiple payloads from one markdown file', () => {
    const md = [
      fence({ entity_name: 'invoice', event_type: 'issued', data: { uid: 'a' } }),
      'some prose',
      fence({ entity_name: 'invoice', event_type: 'paid', data: { uid: 'b' } }),
    ].join('\n\n');
    expect(cap.extractPayloads(md).map((p) => p.event_type)).toEqual(['issued', 'paid']);
  });

  test('ignores valid json fences that are not payload envelopes', () => {
    const md = [fence({ foo: 1 }), fence({ entity_name: 'lead', event_type: 'created', data: {} })].join(
      '\n'
    );
    expect(cap.extractPayloads(md)).toEqual([
      { entity_name: 'lead', event_type: 'created', data: {} },
    ]);
  });

  test('returns [] for non-string input', () => {
    expect(cap.extractPayloads(null)).toEqual([]);
  });
});

describe('findMalformedFences (the gate — surfaces broken docs, never silently skips)', () => {
  test('reports a malformed json fence with its error', () => {
    const md = ['```json\n{ this is : not valid json ,, }\n```', fence({ entity_name: 'x', event_type: 'y', data: {} })].join(
      '\n'
    );
    const bad = cap.findMalformedFences(md);
    expect(bad).toHaveLength(1);
    expect(bad[0].error).toMatch(/JSON/i);
    expect(typeof bad[0].snippet).toBe('string');
  });

  test('returns [] when every json fence is valid', () => {
    const md = [fence({ entity_name: 'x', event_type: 'y', data: {} }), fence({ ok: true })].join('\n');
    expect(cap.findMalformedFences(md)).toEqual([]);
  });

  test('only inspects json fences, not curl/other fences', () => {
    const md = ['```curl\nnot json at all {{{\n```', fence({ entity_name: 'x', event_type: 'y', data: {} })].join(
      '\n'
    );
    expect(cap.findMalformedFences(md)).toEqual([]);
  });
});

describe('toSampleFiles', () => {
  test('maps payloads to webhook_samples/<entity>/<event_type>.json in envelope format', () => {
    const payloads = [
      { entity_name: 'client', event_type: 'created', data: { uid: '1' } },
      { entity_name: 'invoice', event_type: 'paid', data: { uid: '2' } },
    ];
    const byPath = Object.fromEntries(cap.toSampleFiles(payloads).map((f) => [f.path, f.content]));
    expect(Object.keys(byPath).sort()).toEqual([
      'webhook_samples/client/created.json',
      'webhook_samples/invoice/paid.json',
    ]);
    expect(byPath['webhook_samples/client/created.json']).toEqual([
      { entity_name: 'client', event_type: 'created', data: { uid: '1' } },
    ]);
  });

  test('dedupes by entity/event_type, keeping the first occurrence', () => {
    const payloads = [
      { entity_name: 'client', event_type: 'created', data: { uid: 'first' } },
      { entity_name: 'client', event_type: 'created', data: { uid: 'second' } },
    ];
    const files = cap.toSampleFiles(payloads);
    expect(files).toHaveLength(1);
    expect(files[0].content[0].data.uid).toBe('first');
  });

  test('skips entries missing entity_name or event_type', () => {
    const payloads = [
      { entity_name: 'client', data: {} },
      { event_type: 'created', data: {} },
      { entity_name: 'lead', event_type: 'created', data: { uid: 'ok' } },
    ];
    expect(cap.toSampleFiles(payloads).map((f) => f.path)).toEqual([
      'webhook_samples/lead/created.json',
    ]);
  });
});
