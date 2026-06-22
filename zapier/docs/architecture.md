# Architecture

## Repo strategy

The integration is built **inside developers-hub** (single repo) for the initial
build. The trade-off:

- **Single repo (current):** fewest moving parts; the generator reads sibling
  specs directly; one branch holds manifest + generated app.
- **Separate repo (possible later):** cleaner separation of a deployable runtime
  artifact (its own `zapier push`/`promote` lifecycle, `ZAPIER_DEPLOY_KEY`, CI)
  from a docs/spec-publishing repo. The generator would then consume the
  **published** specs from `https://vcita.github.io/developers-hub/`.

If/when this graduates from spike to a published, maintained integration, revisit
the split. The manifest is designed to stay put regardless — exposure is an
API-governance decision that belongs beside the APIs.

## Sources of truth

| Concern | Source of truth | Notes |
|---------|-----------------|-------|
| **APIs (creates)** | `mcp_swagger/*.json` | Unified domain specs. NOT `swagger/` or `entities/`. |
| **Webhook trigger list** | Webhook **subscribe enum** (`POST /platform/v1/webhook/subscribe`) | The authoritative set of `entity/event_type` values. |
| **Webhook payloads** | readme_sync webhook-response docs | Captured into `zapier/webhook_samples/` for offline, deterministic generation. |
| **What to expose** | `zapier/manifest.yaml` | The human curation gate (see [scope.md](scope.md)). |

`entities/*.json` are intentionally **not** used: webhook payloads have their own
envelope shape (see below), and create inputs come from the spec `requestBody`.

## Layout

Everything Zapier-specific lives under one `zapier/` root:

```
zapier/
├── docs/                      # this folder — decisions anchored here
│   ├── README.md
│   ├── scope.md
│   └── architecture.md
├── manifest.yaml              # what to expose (triggers + creates)
├── jest.config.js             # test config for the generator + app
├── webhook_samples/           # trigger payload source of truth (published via Pages)
│   └── <entity>/<event_type>.json
└── app/                       # generated Platform CLI project (committed)
    ├── package.json           # static scaffold (not regenerated)
    ├── authentication.js      # static — token field + Bearer injection
    ├── middleware.js          # static — request/response hooks
    ├── index.js               # GENERATED
    ├── triggers/              # GENERATED (one file per trigger)
    └── creates/               # GENERATED (one file per create)

scripts/
└── generate-zapier.js         # manifest + mcp_swagger + samples -> zapier/app/
```

> `webhook_samples/` lives under `zapier/` on purpose: the samples are shaped
> **for Zapier**, not as a neutral representation. Each file is a JSON **array**
> (`[{entity_name, event_type, data}]`) so the trigger `perform` can unwrap a
> batched delivery into one Zapier event per element. A general-purpose webhook
> doc would more likely store a single object — the array is a Zapier-ism.

The generator **regenerates** `index.js`, `triggers/`, and `creates/` only. The
static scaffold (`package.json`, `authentication.js`, `middleware.js`) is created
once and never overwritten, so auth/middleware tweaks are safe.

## Generation pipeline

```
zapier/manifest.yaml        ─┐
mcp_swagger/*.json          ─┼─> scripts/generate-zapier.js ─> zapier/app/{index,triggers,creates}
zapier/webhook_samples/*    ─┘
```

1. Load the manifest.
2. Index every operation across `mcp_swagger/*.json` by `METHOD path`.
   (Most operations have **no `operationId`**, so selection is by method+path.)
3. **Creates:** for each manifest create, resolve the operation, build Zapier
   input fields from the `requestBody` schema (resolving local `$ref`s,
   skipping `readOnly`), and `z.request` to the path on `https://api.vcita.biz`.
4. **Triggers:** validate each event against the subscribe enum; build a REST
   Hook (subscribe/unsubscribe against the webhook endpoints) whose output
   fields + sample come from the captured payload.
5. Emit files; `log` any trigger missing a payload sample.

## Auth model

**API key / token** (chosen over OAuth2 for the initial build).

- Custom auth with a single token input field.
- `test` calls a cheap business-scoped endpoint (e.g. `GET /platform/v1/webhooks`).
- `beforeRequest` injects `Authorization: Bearer <token>`.
- Token type: business-level **staff / app** token (see [scope.md](scope.md)).

## Webhook payload shape

Payloads are **not** the entity schema. They are a batched envelope:

```json
[{
  "entity_name": "appointment",
  "event_type": "scheduled",
  "data": { "business_id": "...", "appointment_id": "...", "start_time": "...", "...": "..." }
}]
```

- Delivered as an **array** — the trigger `perform` unwraps it, emitting one
  Zapier event per element.
- The trigger output fields + `sample` come from the `data` object, which uses
  webhook-specific naming (`appointment_id`, not entity `uid`).

## Webhook payload samples (GitHub Pages)

`zapier/webhook_samples/<entity>/<event_type>.json` holds a captured payload per event.
These serve two consumers from one source:

1. **The generator** reads them locally at build time and inlines each `data`
   object as the trigger's Zapier `sample`.
2. **GitHub Pages** publishes them publicly (same site that serves entities):
   `https://vcita.github.io/developers-hub/zapier/webhook_samples/<entity>/<event_type>.json`

`scripts/capture-webhook-samples.js` refreshes these by calling
`GET /platform/v1/webhooks` with a token
(`VCITA_TOKEN=… npm run zapier:capture-samples`). Samples are committed so
generation is offline and deterministic.

## Testing (TDD)

Pure logic is unit-tested with Jest; run `npm run test:zapier`
(config: `zapier/jest.config.js`). Covered:

- `zapier/app/utils.js` — `buildBody`, `unwrapWebhook`, `safeJson`, `toInputField`
- `scripts/generate-zapier.js` — `walkSchema`, `deref`, `zapierType`,
  `sanitizeKey`, `outputFieldsFromSample` (exported; `main` runs only when the
  script is invoked directly, so requiring it has no side effects)
- `scripts/capture-webhook-samples.js` — `extractEvents`, `toSampleFiles`

New behavior is added test-first (red → green). The generated `index.js` is also
checked against Zapier's `validateAppDefinition` (functions stubbed as
`$func$N$f$` placeholders, the form Zapier validates after compilation).
