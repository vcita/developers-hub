# How to update the inTandem Zapier app

The Zapier app is **generated**, not hand-written. You edit a short list of what
to expose, run the generator, test, and push. You never edit the app code
directly.

> **TL;DR:** edit [`manifest.yaml`](manifest.yaml) → `npm run zapier:generate` →
> `npm run test:zapier` → bump the version → `zapier-platform push`.

## The pieces

| Path | What it is | Edit it? |
|------|-----------|----------|
| `zapier/manifest.yaml` | The control panel — what triggers/creates/dropdowns to expose | ✅ **yes, this is the file you edit** |
| `zapier/webhook_samples/` | Example webhook payloads (give triggers their output shape) | only via the capture script |
| `zapier/app/` | The generated Zapier app (triggers/, creates/, index.js) | ❌ **never — overwritten on every generate** |
| `zapier/app/{authentication,middleware,utils,constants}.js` | Static scaffold (auth, helpers) | ✅ rarely, by hand |
| `mcp_swagger/*.json` | vcita API specs the generator reads | n/a (separate pipeline) |
| `scripts/generate-zapier.js` | The generator (build tooling) | only to change generation logic |

Three things the app exposes:
- **Trigger** — "when X happens in inTandem, start a Zap" (from webhooks).
- **Create** — "Zapier does X in inTandem" (from API endpoints).
- **Dropdown** — a friendly picker for an ID field instead of a raw UID.

## Common updates

All of these are edits to `manifest.yaml`, then regenerate.

### Add a Create
```yaml
creates:
  - key: refund                              # unique id
    noun: Refund
    label: Create Refund
    method: POST
    path: /business/payments/v1/refunds      # the API endpoint
    spec: sales                              # which mcp_swagger/<spec>.json file
```
Input fields are derived automatically from the endpoint's request body.

If the create needs a `matter_uid`, add `client_matter: true` instead of exposing
the raw UID. The user then picks a **Client** (clients dropdown) and the app
resolves that client's matter at runtime (there is no list-all matters endpoint —
see [docs/architecture.md](docs/architecture.md) → "Matters").

### Add a Trigger
The event must exist in vcita's webhook subscribe enum.
```yaml
triggers:
  - event: invoice/paid
    noun: Invoice
    create: invoice        # optional: links to a related Create
```
If the trigger has no payload sample yet, run `npm run zapier:capture-samples`
first (it pulls examples from the readme_sync webhook docs). The generator logs
a warning for any trigger missing a sample.

### Add a Dropdown (for an ID field)
Point it at a list endpoint; any input field whose name matches `field_leaves`
gets the picker.
```yaml
dropdowns:
  - key: products
    noun: Product
    method: GET
    path: /business/payments/v1/products
    spec: sales
    array_path: data.products    # where the array lives in the response ("" = top-level array)
    id_field: uid
    label_fields: [name]         # joined with spaces for the label
    field_leaves: [product_id]   # input fields to attach the dropdown to
                                 # (use a full dotted key like "category__uid" for generic leaves)
```
The generator turns each dropdown into a hidden "list" trigger that fetches the
options. If a path contains `{business_uid}`, it's auto-resolved from the token.

## Build, test, validate

```bash
npm run zapier:generate     # rebuild zapier/app from the manifest
npm run test:zapier         # unit tests for the generator + helpers
cd zapier/app && zapier-platform validate   # Zapier's own checks
```

`validate` must show **0 errors** and **0 publishing tasks**. General "Warnings"
are advisory (e.g. an ID field with no list endpoint to back a dropdown) and
don't block.

## Smoke test (does it actually work against the live API?)

`npm run test:zapier` is offline (unit tests only). To check the app against the
**real inTandem API**, use the smoke test. It needs a token and **skips itself**
when none is present (so it never breaks CI/normal runs).

```bash
cp zapier/app/.env.example zapier/app/.env   # then set INTANDEM_SMOKE_TOKEN=<staff token>
npm run zapier:smoke                         # Tier 1: SAFE
```
**Tier 1 (safe, default):** validates auth, subscribes+unsubscribes every webhook
trigger (self-cleaning), and reads every dropdown list endpoint. Writes no data.

```bash
npm run zapier:smoke:creates                 # Tier 2: DESTRUCTIVE — sandbox only
```
**Tier 2 (opt-in):** also exercises all 9 creates, so it **writes real records** —
run it only against a **sandbox** business. Records are labelled `Zapier Smoke …`
for manual cleanup (the app has no delete actions). Set
`INTANDEM_SMOKE_BUSINESS_UID` in `.env` to hard-guard the target business.

Run it with **Node 22** (same as the CLI). A failure pinpoints the broken
operation (e.g. `inTandem API 404: …`). For ad-hoc manual checks:
`npx zapier-platform-cli invoke trigger list_clients`.

## Publish a new version

Requires **Node ≥ 22** and **zapier-platform-cli v19** (see
[`app/README.md`](app/README.md)).

```bash
# 1. bump the version in zapier/app/package.json, e.g. "1.0.2" -> "1.0.3"
cd zapier/app
zapier-platform push                 # uploads the new version (private)
zapier-platform promote 1.0.3        # optional: make it the live version for users
```
Zapier won't overwrite an existing version — always bump first.

## Golden rules

1. **Edit `manifest.yaml`, never `zapier/app/`.** Generated files are disposable.
2. **Always** regenerate → test → validate before pushing.
3. **Bump the version** before every `push`.
4. **Triggers need a sample** — capture one if the generator warns.
5. The app is **inTandem-branded** (user-facing); the internal host stays
   `api.vcita.biz`. Keep that split.

## More background

- [`docs/scope.md`](docs/scope.md) — what's in/out of scope and why.
- [`docs/architecture.md`](docs/architecture.md) — how the generator works end-to-end.
- [`app/README.md`](app/README.md) — exact toolchain versions.
