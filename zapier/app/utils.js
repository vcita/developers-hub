// Runtime helpers shared by generated creates/triggers. Static.

// Rebuild a nested request body from flat Zapier inputData keyed by dotted
// paths (e.g. "invoice__amount" -> { invoice: { amount: ... } }).
// Fields generated for object wrappers / $ref schemas use "__" as separator.
const buildBody = (inputData, fields) => {
  const body = {};
  for (const field of fields) {
    const value = inputData[field.key];
    if (value === undefined || value === null || value === '') continue;
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
  return out;
};

module.exports = { buildBody, safeJson, unwrapWebhook, toInputField };
