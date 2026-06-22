# inTandem Zapier App (generated)

This is a [Zapier Platform CLI](https://platform.zapier.com/) app **generated**
from developers-hub specs. Do not hand-edit `index.js`, `triggers/`, or
`creates/` — they are overwritten on every generate.

## Requirements

The toolchain versions must line up or the CLI refuses to validate/push:

| Tool | Required version | Notes |
|------|------------------|-------|
| **Node.js** | **≥ 22** | `zapier-platform-cli` v19 requires it; v20 will error. |
| **zapier-platform-cli** | **v19** (global) | The command is **`zapier-platform`** (renamed from `zapier` in v19). Install with `npm i -g zapier-platform-cli`. |
| **zapier-platform-core** | **`19.0.0` exact** | Pinned in `package.json` — Zapier requires an exact version (no `^`/`~`), and its major must match the CLI. |

If you're on nvm: `nvm install 22 && nvm use 22`, then reinstall the CLI under Node 22.

## Regenerate

From the repo root:

```bash
node scripts/generate-zapier.js
```

Edit [`../manifest.yaml`](../manifest.yaml) to change what is
exposed. See [`../docs/`](../docs/) for scope and architecture.

## What is static vs generated

| Static (edit freely) | Generated (do not edit) |
|----------------------|-------------------------|
| `package.json`, `authentication.js`, `middleware.js`, `utils.js`, `constants.js` | `index.js`, `triggers/*.js`, `creates/*.js` |

## Auth

Custom auth: the user pastes a business-level (staff/app) inTandem API token, sent
as a Bearer token. Validated against `GET /platform/v1/webhooks`.

## Triggers

REST Hooks. Each subscribes via `POST /platform/v1/webhook/subscribe` and
unsubscribes via `POST /platform/v1/webhook/unsubscribe`. Inbound payloads are a
batched envelope `[{entity_name, event_type, data}]`, unwrapped to one Zapier
event per element. Output sample/fields come from `../webhook_samples/`.

> **Samples needed:** triggers without a captured payload sample are scaffolded
> with a placeholder. Run the generator to see which (it logs warnings) and add
> `../webhook_samples/<entity>/<event_type>.json` for each.

## Local checks

```bash
cd zapier/app && npm install
# structural schema validation + runtime smoke tests were run during build.
# For full validation incl. functions, use the Zapier CLI:
zapier-platform validate
```

## Deploy (requires Node ≥ 22, Zapier CLI v19, and an account)

All commands run from `zapier/app`:

```bash
npm i -g zapier-platform-cli        # v19 — provides the `zapier-platform` command
zapier-platform login               # saves a deploy key to ~/.zapierrc
zapier-platform register "inTandem" # first time only (creates the integration)
zapier-platform validate
zapier-platform push                # or: npm run zapier:push
zapier-platform promote 1.0.0       # make a version live
```
