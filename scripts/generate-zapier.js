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
// Dynamic dropdown ref for an input field (D004): map its leaf name to a list
// trigger. The list trigger always exposes `id` + `label`, so the ref is fixed.
const dropdownRef = (fieldKey, byLeaf) => {
  const leaf = String(fieldKey).split('__').pop();
  // Match the full dotted key first (lets a generic leaf like "uid" be targeted
  // precisely via "category__uid"), then fall back to the bare leaf.
  const key = byLeaf[fieldKey] || byLeaf[leaf];
  return key ? `list_${key}.id.label` : undefined;
};

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
  let bodyFields = fields; // path params are separate, added below
  // client_matter (D030): business owners pick a Client, not a matter_uid. Drop
  // the matter_uid field(s) from the body and resolve the client's matter into
  // the body at runtime. The client source is either an existing client_id body
  // field (e.g. booking, which the API wants natively) or — when none exists
  // (note/invoice/estimate) — a synthetic UI-only Client picker.
  let clientField = null; // synthetic, UI-only (excluded from body)
  let clientSourceKey = null; // inputData key to resolve the matter from
  let matterPaths = [];
  if (create.client_matter) {
    const matterFields = bodyFields.filter((f) => f.path[f.path.length - 1] === 'matter_uid');
    matterPaths = matterFields.map((f) => f.path);
    if (matterPaths.length) {
      bodyFields = bodyFields.filter((f) => f.path[f.path.length - 1] !== 'matter_uid');
      const existingClient = bodyFields.find((f) => f.path[f.path.length - 1] === 'client_id');
      if (existingClient) {
        // Reuse the native client_id (stays in the body); just source the matter from it.
        existingClient.dynamic = 'list_clients.id.label';
        clientSourceKey = existingClient.key;
      } else {
        clientField = {
          key: 'client_id',
          label: 'Client',
          type: 'string',
          required: matterFields.some((f) => f.required),
          dynamic: 'list_clients.id.label',
          helpText: 'The client to attach this to — their matter is resolved automatically.',
        };
        clientSourceKey = clientField.key;
      }
    }
  }
  const pathFields = pathParams.map((p) => ({
    key: p,
    label: humanize(p),
    type: 'string',
    required: true,
    helpText: `Path parameter: ${p}`,
  }));
  return `// GENERATED by scripts/generate-zapier.js — do not edit by hand.
const { BASE_URL } = require('../constants');
const { buildBody, toInputField, resolveMatterUid, setByPath } = require('../utils');

const PATH = ${j(create.path)};
const METHOD = ${j(create.method)};
const PATH_PARAMS = ${j(pathParams)};

// Body field definitions (with internal path/isJson used to rebuild the body).
const bodyFields = ${j(bodyFields)};
const pathFields = ${j(pathFields)};
// client_matter (D030): matter_uid is resolved from the chosen client (either a
// synthetic Client picker or an existing client_id field) and injected at these
// body paths. CLIENT_FIELD is the synthetic UI-only field (null when reusing a
// native client_id); CLIENT_SOURCE_KEY is the inputData key to resolve from.
const CLIENT_FIELD = ${j(clientField)};
const CLIENT_SOURCE_KEY = ${j(clientSourceKey)};
const MATTER_PATHS = ${j(matterPaths)};
// Body shaping: WRAP_ARRAY wraps the built body as { [WRAP_ARRAY]: [body] };
// BODY_CONST merges constant keys at the top level (e.g. { new_api: true }).
const WRAP_ARRAY = ${j(create.wrap_array || null)};
const BODY_CONST = ${j(create.body_const || null)};

const inputFields = [
  ...pathFields,
  ...(CLIENT_FIELD ? [toInputField(CLIENT_FIELD)] : []),
  ...bodyFields.map(toInputField),
];

// Static sample of the created record (D012). Reuses the linked trigger's real
// payload where the manifest pairs one; otherwise a minimal stub.
const sample = ${j(sample)};

const perform = async (z, bundle) => {
  let url = \`\${BASE_URL}\${PATH}\`;
  for (const p of PATH_PARAMS) {
    url = url.replace(\`{\${p}}\`, encodeURIComponent(bundle.inputData[p]));
  }
  const body = buildBody(bundle.inputData, bodyFields);
  if (CLIENT_SOURCE_KEY && MATTER_PATHS.length) {
    const matterUid = await resolveMatterUid(z, bundle, bundle.inputData[CLIENT_SOURCE_KEY]);
    if (CLIENT_FIELD && CLIENT_FIELD.required && !matterUid) {
      throw new z.errors.Error(
        'Could not find a matter for the selected client. Pick a client that has at least one matter.',
        'MatterNotFound'
      );
    }
    if (matterUid) for (const p of MATTER_PATHS) setByPath(body, p, matterUid);
  }
  let payload = body;
  if (WRAP_ARRAY) payload = { [WRAP_ARRAY]: [body], ...(BODY_CONST || {}) };
  else if (BODY_CONST) payload = { ...body, ...BODY_CONST };
  const response = await z.request({ url, method: METHOD, body: payload });
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

// A hidden polling trigger that backs a dynamic dropdown (D004): fetches the
// list endpoint and maps each item to { id, label, ...item }.
const emitListTrigger = (dd) => `// GENERATED by scripts/generate-zapier.js — do not edit by hand.
const { BASE_URL } = require('../constants');
const { getByPath, resolveBusinessUid } = require('../utils');

const PATH = ${j(dd.path)};
const PATH_PARAMS = ${j(pathParamsOf(dd.path))};
const ARRAY_PATH = ${j(dd.array_path)};
const ID_FIELD = ${j(dd.id_field)};
const LABEL_FIELDS = ${j(dd.label_fields || [dd.id_field])};
const QUERY = ${j(dd.query || {})};

const perform = async (z, bundle) => {
  let url = \`\${BASE_URL}\${PATH}\`;
  for (const p of PATH_PARAMS) {
    // business_uid is auto-resolved from the token's business; other path params
    // come from auth data. If it can't be resolved, return no options instead
    // of erroring.
    const value = p === 'business_uid' ? await resolveBusinessUid(z, bundle) : bundle.authData && bundle.authData[p];
    if (!value) return [];
    url = url.replace(\`{\${p}}\`, encodeURIComponent(value));
  }
  // Resolve {business_uid} placeholders in query params from the token's business
  // (some list endpoints require business_id as a query param, not a path param).
  const params = { ...QUERY };
  for (const k of Object.keys(params)) {
    if (params[k] === '{business_uid}') {
      const biz = await resolveBusinessUid(z, bundle);
      if (!biz) return [];
      params[k] = biz;
    }
  }
  const response = await z.request({ url, method: 'GET', params });
  const list = getByPath(response.data, ARRAY_PATH) || [];
  return list.map((item) => ({
    ...item,
    id: item[ID_FIELD],
    label: LABEL_FIELDS.map((f) => item[f]).filter(Boolean).join(' ') || String(item[ID_FIELD]),
  }));
};

module.exports = {
  key: ${j(`list_${dd.key}`)},
  noun: ${j(dd.noun)},
  display: {
    label: ${j(`List ${dd.noun}s`)},
    description: ${j(`Internal: lists ${dd.noun.toLowerCase()}s to populate dynamic dropdowns.`)},
    hidden: true,
  },
  operation: { perform, canPaginate: true },
};
`;

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
  // Don't auto-clean input data — keep what the user maps predictable (D028).
  flags: { cleanInputData: false },
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
  const fields = [];
  for (const [k, v] of Object.entries(sample)) {
    // Skip object/array values: Zapier defaults an untyped output field to
    // "string", which mismatches a dict/list sample (D024). The data still
    // flows through; we just don't declare a (wrong) scalar field for it.
    if (v !== null && typeof v === 'object') continue;
    const field = { key: k, label: humanize(k), type: 'string' };
    if (typeof v === 'number') field.type = 'number';
    else if (typeof v === 'boolean') field.type = 'boolean';
    fields.push(field);
  }
  return fields;
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

  // Dynamic-dropdown leaf map (D004): input-field leaf name -> dropdown key.
  const byLeaf = {};
  for (const dd of manifest.dropdowns || []) {
    for (const leaf of dd.field_leaves || []) byLeaf[leaf] = dd.key;
  }

  // ---- Creates ----
  const specCache = {};
  const createKeys = [];
  for (const create of manifest.creates || []) {
    let fields;
    if (create.fields) {
      // Explicit field definitions — for endpoints not in mcp_swagger (e.g. the
      // staff appointments endpoint). Each entry is a flat input field.
      fields = create.fields.map((f) => ({
        key: f.key,
        path: [f.key],
        label: f.label || humanize(f.key),
        type: f.type || 'string',
        required: !!f.required,
        isJson: !!f.isJson,
        ...(f.default !== undefined ? { default: f.default } : {}),
        ...(f.helpText ? { helpText: f.helpText } : {}),
        ...(f.choices ? { choices: f.choices.map(String) } : {}),
      }));
    } else {
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
      fields = walkSchema(schema, spec, { path: [], depth: 0, parentRequired: true });
    }
    // Wire dynamic dropdowns onto ID fields (D004).
    for (const f of fields) {
      const ref = dropdownRef(f.key, byLeaf);
      if (ref) f.dynamic = ref;
    }
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

  // ---- Dropdown list triggers (hidden, back dynamic dropdowns) ----
  for (const dd of manifest.dropdowns || []) {
    fs.writeFileSync(path.join(TRIGGERS_DIR, `list_${dd.key}.js`), emitListTrigger(dd));
    triggerKeys.push(`list_${dd.key}`);
    report.triggers.push(`list_${dd.key} (dropdown: ${(dd.field_leaves || []).join(', ')})`);
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
  dropdownRef,
  outputFieldsFromSample,
  emitListTrigger,
  emitCreate,
  main,
};

if (require.main === module) main();
