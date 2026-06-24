// Runtime helpers shared by generated creates/triggers. Static.

// Rebuild a nested request body from flat Zapier inputData keyed by dotted
// paths (e.g. "invoice__amount" -> { invoice: { amount: ... } }).
// Fields generated for object wrappers / $ref schemas use "__" as separator.
const buildBody = (inputData, fields) => {
  const body = {};
  for (const field of fields) {
    let value = inputData[field.key];
    if (value === undefined || value === null || value === '') {
      // Send the field's default (e.g. '') even when blank, so endpoints that
      // require the key present but accept an empty value are satisfied.
      if (field.default === undefined) continue;
      value = field.default;
    }
    const path = field.path || [field.key];
    let node = body;
    for (let i = 0; i < path.length - 1; i++) {
      node[path[i]] = node[path[i]] || {};
      node = node[path[i]];
    }
    node[path[path.length - 1]] = field.isJson ? safeJson(value) : value;
  }
  return body;
};

const safeJson = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
};

// Webhook payloads arrive as an array of envelopes:
//   [{ entity_name, event_type, data }]
// Return the unwrapped data objects (one Zapier event each).
const unwrapWebhook = (payload) => {
  const items = Array.isArray(payload) ? payload : [payload];
  return items.map((item) => (item && item.data ? item.data : item));
};

// Project a generated field definition down to the strict Zapier inputField
// shape (drops internal keys like `path`/`isJson` that Zapier rejects).
const toInputField = (f) => {
  const out = { key: f.key, label: f.label, type: f.type };
  if (f.required) out.required = true;
  if (f.helpText) out.helpText = f.helpText;
  if (f.choices && f.choices.length) out.choices = f.choices;
  if (f.dynamic) out.dynamic = f.dynamic; // dynamic dropdown: "trigger.id.label"
  return out;
};

// Resolve a dotted path (e.g. "data.clients") inside a response body. Used by
// generated dropdown list triggers to find the array of items.
const getByPath = (obj, path) => {
  if (!path) return obj;
  return path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), obj);
};

// Resolve the connection's business UID. No token-scoped endpoint returns it
// directly, so we read it from GET /v3/business_administration/businesses (the
// staff token's own business). An explicit authData.business_uid wins if set.
const resolveBusinessUid = async (z, bundle) => {
  const { BASE_URL } = require('./constants');
  if (bundle && bundle.authData && bundle.authData.business_uid) {
    return bundle.authData.business_uid;
  }
  const response = await z.request({
    url: `${BASE_URL}/v3/business_administration/businesses`,
    method: 'GET',
    params: { per_page: 1 },
  });
  const list = getByPath(response.data, 'data.businesses') || [];
  return (list[0] && (list[0].uid || list[0].id)) || null;
};

// Resolve a client's primary matter UID. Business owners pick a Client (by name,
// via the clients dropdown); the create attaches to that client's matter. There
// is no list-all matters endpoint, but the client DETAIL endpoint carries the
// client's matters[] — take the first (the default matter).
const resolveMatterUid = async (z, bundle, clientId) => {
  if (!clientId) return null;
  const { BASE_URL } = require('./constants');
  const response = await z.request({
    url: `${BASE_URL}/platform/v1/clients/${encodeURIComponent(clientId)}`,
    method: 'GET',
  });
  const matters = getByPath(response.data, 'data.client.matters') || [];
  return (matters[0] && (matters[0].uid || matters[0].id)) || null;
};

// Set a nested value by path array (e.g. ['invoice','matter_uid']), creating
// intermediate objects. Used to inject a resolved value into a built body.
const setByPath = (obj, path, value) => {
  let node = obj;
  for (let i = 0; i < path.length - 1; i++) {
    node[path[i]] = node[path[i]] || {};
    node = node[path[i]];
  }
  node[path[path.length - 1]] = value;
  return obj;
};

module.exports = { buildBody, safeJson, unwrapWebhook, toInputField, getByPath, resolveBusinessUid, resolveMatterUid, setByPath };
