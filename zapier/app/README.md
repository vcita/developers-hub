# vcita Zapier App (generated)

This is a [Zapier Platform CLI](https://platform.zapier.com/) app **generated**
from developers-hub specs. Do not hand-edit `index.js`, `triggers/`, or
`creates/` — they are overwritten on every generate.

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

Custom auth: the user pastes a business-level (staff/app) vcita API token, sent
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
# For full validation incl. functions, use the Zapier CLI: `zapier validate`.
```

## Deploy (requires Zapier CLI + account)

```bash
npm i -g zapier-platform-cli
zapier login
zapier register   # first time only
zapier push
```
