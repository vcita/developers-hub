#!/usr/bin/env node
/**
 * generate-zapier.js
 *
 * Generates the Zapier Platform CLI app (zapier/app/{index,triggers,creates})
 * from:
 *   - zapier/manifest.yaml          (the curation gate — what to expose)
 *   - mcp_swagger/*.json            (APIs / create request bodies)
 *   - webhook subscribe enum        (valid trigger entities)
 *   - zapier/webhook_samples/*.json (trigger output shape + sample)
 *
 * Only the dynamic parts are (re)generated. The static scaffold
 * (package.json, authentication.js, middleware.js, utils.js, constants.js)
 * is never touched.
 *
 * See zapier/docs/architecture.md for the design.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const REPO = path.resolve(__dirname, '..');
const MANIFEST = path.join(REPO, 'zapier', 'manifest.yaml');
const MCP_DIR = path.join(REPO, 'mcp_swagger');
const APP = path.join(REPO, 'zapier', 'app');
const TRIGGERS_DIR = path.join(APP, 'triggers');
const CREATES_DIR = path.join(APP, 'creates');
const SAMPLES_DIR = path.join(REPO, 'zapier', 'webhook_samples');
const MAX_DEPTH = 3;

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const clip = (s, n = 900) =>
  typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, n) : undefined;
const humanize = (s) =>
  String(s)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
const sanitizeKey = (s) => s.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
// Title-case an "entity/event_type" for display labels (D018), keeping / and _.
const titleCaseEvent = (event) =>
  String(event)
    .split('/')
    .map((seg) => seg.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('_'))
    .join('/');
// Normalize a string for redundancy comparison (D011): lowercase, alphanumerics only.
const normalize = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');

const resolveRef = (spec, ref) => {
  if (!ref.startsWith('#/')) return null; // external $ref — treated as opaque
  return ref
    .slice(2)
    .split('/')
    .reduce((node, key) => (node ? node[key] : undefined), spec);
};

const deref = (schema, spec, seen = new Set()) => {
  if (schema && schema.$ref) {
    if (seen.has(schema.$ref)) return {};
    seen.add(schema.$ref);
    const r = resolveRef(spec, schema.$ref);
    return r ? deref(r, spec, seen) : {};
  }
  return schema || {};
};

const zapierType = (schema) => {
  const t = schema.type;
  const fmt = schema.format;
  if (t === 'string' && (fmt === 'date-time' || fmt === 'date')) return 'datetime';
  if (t === 'integer' || t === 'number') return 'number';
  if (t === 'boolean') return 'boolean';
  return 'string';
};

const makeField = (fieldPath, schema, required, isJson) => {
  const field = {
    key: fieldPath.join('__'),
    path: fieldPath,
    label: humanize(fieldPath[fieldPath.length - 1]),
    type: isJson ? 'text' : zapierType(schema),
    required: !!required,
    isJson: !!isJson,
  };
  const help = clip(schema.description);
  // Skip helpText that just repeats the label (D011 redundant help text).
  if (help && (isJson || normalize(help) !== normalize(field.label))) {
    field.helpText = isJson ? `${help} (JSON)` : help;
  }
  if (!isJson && Array.isArray(schema.enum)) field.choices = schema.enum.map(String);
  return field;
};

// Walk a request body schema into a flat list of leaf body fields. Object
// wrappers / $ref objects descend (dotted "a__b" keys, rebuilt at runtime);
// arrays and property-less objects become JSON text fields.
const walkSchema = (schema, spec, ctx) => {
  schema = deref(schema, spec);
  if (Array.isArray(schema.allOf)) {
    const merged = { type: 'object', properties: {}, required: [] };
    for (const sub of schema.allOf) {
      const d = deref(sub, spec);
      Object.assign(merged.properties, d.properties || {});
      if (Array.isArray(d.required)) merged.required.push(...d.required);
    }
    schema = merged;
  }
  const props = schema.properties;
  if (!props || typeof props !== 'object') return [];

  const required = new Set(schema.required || []);
  const fields = [];
  for (const [name, raw] of Object.entries(props)) {
    const child = deref(raw, spec);
    if (child.readOnly === true) continue;
    const fieldPath = [...ctx.path, name];
    const reqHere = ctx.parentRequired && required.has(name);
    const hasProps = child.properties && Object.keys(child.properties).length;
    const isObject = child.type === 'object' || child.properties;

    if (isObject && hasProps && ctx.depth < MAX_DEPTH) {
      fields.push(
        ...walkSchema(child, spec, {
          path: fieldPath,
          depth: ctx.depth + 1,
          parentRequired: reqHere,
        })
      );
    } else if (child.type === 'array' || (isObject && !hasProps)) {
      fields.push(makeField(fieldPath, child, reqHere, true));
    } else {
      fields.push(makeField(fieldPath, child, reqHere, false));
    }
  }
  return fields;
};

const pathParamsOf = (p) => [...p.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);

// The subscribe enum may be full `entity/event_type` pairs (current) or legacy
// entity-only prefixes. Accept an event if it matches a full enum value, or its
// entity prefix is listed.
const isValidEvent = (event, enumVals) =>
  enumVals.includes(event) || enumVals.includes(event.split('/')[0]);

// --------------------------------------------------------------------------
// Code emitters
// --------------------------------------------------------------------------
const j = (v) => JSON.stringify(v, null, 2);

const emitCreate = (create, fields, pathParams, sample) => {
  const bodyFields = fields; // path params are separate, added below
  const pathFields = pathParams.map((p) => ({
    key: p,
    label: humanize(p),
    type: 'string',
    required: true,
    helpText: `Path parameter: ${p}`,
  }));
  return `// GENERATED by scripts/generate-zapier.js — do not edit by hand.
const { BASE_URL } = require('../constants');
const { buildBody, toInputField } = require('../utils');

const PATH = ${j(create.path)};
const METHOD = ${j(create.method)};
const PATH_PARAMS = ${j(pathParams)};

// Body field definitions (with internal path/isJson used to rebuild the body).
const bodyFields = ${j(bodyFields)};
const pathFields = ${j(pathFields)};

const inputFields = [...pathFields, ...bodyFields.map(toInputField)];

// Static sample of the created record (D012). Reuses the linked trigger's real
// payload where the manifest pairs one; otherwise a minimal stub.
const sample = ${j(sample)};

const perform = async (z, bundle) => {
  let url = \`\${BASE_URL}\${PATH}\`;
  for (const p of PATH_PARAMS) {
    url = url.replace(\`{\${p}}\`, encodeURIComponent(bundle.inputData[p]));
  }
  const response = await z.request({
    url,
    method: METHOD,
    body: buildBody(bundle.inputData, bodyFields),
  });
  return response.data;
};

module.exports = {
  key: ${j(create.key)},
  noun: ${j(create.noun)},
  display: {
    label: ${j(create.label)},
    description: ${j(`Create a ${create.noun.toLowerCase()} in inTandem.`)},
  },
  operation: { inputFields, perform, sample },
};
`;
};

const emitTrigger = (trigger) => {
  const key = trigger.tkey;
  return `// GENERATED by scripts/generate-zapier.js — do not edit by hand.
const { BASE_URL } = require('../constants');
const { unwrapWebhook } = require('../utils');

const EVENT = ${j(trigger.event)};

const performSubscribe = async (z, bundle) => {
  const response = await z.request({
    url: \`\${BASE_URL}/platform/v1/webhook/subscribe\`,
    method: 'POST',
    body: { event: EVENT, target_url: bundle.targetUrl },
  });
  return { ...(response.data || {}), event: EVENT, target_url: bundle.targetUrl };
};

const performUnsubscribe = async (z, bundle) => {
  const sub = bundle.subscribeData || {};
  const response = await z.request({
    url: \`\${BASE_URL}/platform/v1/webhook/unsubscribe\`,
    method: 'POST',
    body: { event: EVENT, target_url: sub.target_url },
  });
  return response.data;
};

// Inbound webhook delivery: [{ entity_name, event_type, data }] -> data objects.
const perform = (z, bundle) => unwrapWebhook(bundle.cleanedRequest);

// No "recent events" endpoint exists, so the captured sample is the fallback
// users see when pulling a sample during Zap setup.
const sample = ${j(trigger.sample)};
const performList = async () => [sample];

const outputFields = ${j(trigger.outputFields)};

module.exports = {
  key: ${j(key)},
  noun: ${j(trigger.noun)},
  display: {
    label: ${j(`New ${trigger.noun} (${titleCaseEvent(trigger.event)})`)},
    description: ${j(`Triggers when an inTandem "${trigger.event}" webhook fires.`)},
  },
  operation: {
    type: 'hook',
    performSubscribe,
    performUnsubscribe,
    perform,
    performList,
    sample,
    outputFields,
  },
};
`;
};

const emitIndex = (triggerKeys, createKeys) => {
  const reqs = (keys, dir) =>
    keys.map((k) => `  ${JSON.stringify(k)}: require('./${dir}/${k}'),`).join('\n');
  return `// GENERATED by scripts/generate-zapier.js — do not edit by hand.
const authentication = require('./authentication');
const { includeBearerToken, checkForErrors } = require('./middleware');

const triggers = {
${reqs(triggerKeys, 'triggers')}
};

const creates = {
${reqs(createKeys, 'creates')}
};

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  authentication,
  beforeRequest: [includeBearerToken],
  afterResponse: [checkForErrors],
  triggers,
  creates,
};
`;
};

// --------------------------------------------------------------------------
// Sample loading + output fields
// --------------------------------------------------------------------------
const loadSampleData = (trigger) => {
  const [entity, eventType] = trigger.event.split('/');
  const candidates = [];
  if (trigger.sample) candidates.push(path.join(REPO, trigger.sample));
  candidates.push(
    path.join(SAMPLES_DIR, entity, `${eventType}.json`),
    path.join(SAMPLES_DIR, `${entity}s`, `${eventType}.json`)
  );
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      const raw = readJson(file);
      const env = Array.isArray(raw) ? raw[0] : raw;
      return (env && env.data) || env || null;
    }
  }
  return null;
};

const outputFieldsFromSample = (sample) => {
  if (!sample || typeof sample !== 'object') return [];
  return Object.entries(sample).map(([k, v]) => {
    const field = { key: k, label: humanize(k) };
    // Only declare a type for scalars; objects/arrays would otherwise be tagged
    // "string" and mismatch the sample (D024). Leaving type unset lets them pass.
    if (typeof v === 'number') field.type = 'number';
    else if (typeof v === 'boolean') field.type = 'boolean';
    else if (typeof v === 'string') field.type = 'string';
    return field;
  });
};

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------
const cleanDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.js')) fs.unlinkSync(path.join(dir, f));
  }
};

const main = () => {
  const manifest = yaml.load(fs.readFileSync(MANIFEST, 'utf8'));
  const report = { creates: [], triggers: [], warnings: [] };

  // Subscribe enum for trigger validation. May be full entity/event_type pairs
  // or legacy entity-only prefixes — isValidEvent() handles both.
  const platformSpec = readJson(path.join(MCP_DIR, 'platform_administration.json'));
  const subEnum =
    platformSpec.paths['/platform/v1/webhook/subscribe'].post.requestBody.content[
      'application/json'
    ].schema.properties.event.enum || [];

  cleanDir(TRIGGERS_DIR);
  cleanDir(CREATES_DIR);

  // Representative create samples (D012): reuse the payload of a trigger the
  // manifest pairs to this create (`create:` field). Falls back to a stub below.
  const createSamples = {};
  for (const t of manifest.triggers || []) {
    if (t.create) {
      const s = loadSampleData(t);
      if (s) createSamples[t.create] = s;
    }
  }

  // ---- Creates ----
  const specCache = {};
  const createKeys = [];
  for (const create of manifest.creates || []) {
    const specFile = path.join(MCP_DIR, `${create.spec}.json`);
    if (!fs.existsSync(specFile)) {
      report.warnings.push(`create ${create.key}: spec ${create.spec}.json not found — skipped`);
      continue;
    }
    const spec = (specCache[create.spec] =
      specCache[create.spec] || readJson(specFile));
    const op = (spec.paths[create.path] || {})[create.method.toLowerCase()];
    if (!op) {
      report.warnings.push(
        `create ${create.key}: ${create.method} ${create.path} not found in ${create.spec} — skipped`
      );
      continue;
    }
    const schema = op.requestBody && op.requestBody.content['application/json']
      ? op.requestBody.content['application/json'].schema
      : {};
    const fields = walkSchema(schema, spec, { path: [], depth: 0, parentRequired: true });
    const pathParams = pathParamsOf(create.path);
    const sample = createSamples[create.key] || { uid: `sample-${create.key}-uid` };
    fs.writeFileSync(
      path.join(CREATES_DIR, `${create.key}.js`),
      emitCreate(create, fields, pathParams, sample)
    );
    createKeys.push(create.key);
    report.creates.push(`${create.key} (${fields.length} fields)`);
  }

  // ---- Triggers ----
  const triggerKeys = [];
  for (const trigger of manifest.triggers || []) {
    const [entity] = trigger.event.split('/');
    if (!isValidEvent(trigger.event, subEnum)) {
      report.warnings.push(
        `trigger ${trigger.event}: not in subscribe enum — skipped`
      );
      continue;
    }
    const tkey = sanitizeKey(trigger.event);
    let sample = loadSampleData(trigger);
    if (!sample) {
      report.warnings.push(
        `trigger ${trigger.event}: NO payload sample found — scaffolded with placeholder (add zapier/webhook_samples/${entity}/<event>.json)`
      );
      sample = { id: 'sample', entity_name: entity, note: 'placeholder — capture a real payload' };
    }
    const outputFields = outputFieldsFromSample(sample);
    fs.writeFileSync(
      path.join(TRIGGERS_DIR, `${tkey}.js`),
      emitTrigger({ ...trigger, tkey, sample, outputFields })
    );
    triggerKeys.push(tkey);
    report.triggers.push(`${trigger.event} -> ${tkey}`);
  }

  // ---- index.js ----
  fs.writeFileSync(path.join(APP, 'index.js'), emitIndex(triggerKeys, createKeys));

  // ---- Report ----
  console.log('\nZapier app generated.');
  console.log(`  creates: ${report.creates.length}`);
  report.creates.forEach((c) => console.log(`    + ${c}`));
  console.log(`  triggers: ${report.triggers.length}`);
  report.triggers.forEach((t) => console.log(`    + ${t}`));
  if (report.warnings.length) {
    console.log(`\n  warnings (${report.warnings.length}):`);
    report.warnings.forEach((w) => console.log(`    ! ${w}`));
  }
  console.log('');
};

// Exported for unit tests; only auto-run when invoked directly as a script.
module.exports = {
  zapierType,
  sanitizeKey,
  deref,
  resolveRef,
  walkSchema,
  makeField,
  pathParamsOf,
  isValidEvent,
  titleCaseEvent,
  outputFieldsFromSample,
  main,
};

if (require.main === module) main();
