# Plan: Migrate Web AI Widget APIs to `online_presence` Domain

## Goal
Move only Web AI Widget API contracts and runtime endpoint namespaces currently implemented in:
- `webaiwidgetmgr`
- `webaiwidgetserver`

from mixed/current domains to a single `online_presence` domain (docs + runtime + gateway + consumers), with immediate sunset of old paths (no backward compatibility window).

## Current API Inventory (Verified)

### `webaiwidgetmgr` (current base)
`/v3/clientportal/web_ai_widget/widget_configurations`

Endpoints:
- `GET /`
- `POST /`
- `GET /main`
- `PUT /main`
- `GET /public/:widget_uid`
- `GET /public?business_uid=...`
- `GET /ai_guidance`
- `GET /:uid`
- `PUT /:uid`
- `DELETE /:uid`

### `webaiwidgetserver` (current bases)
`/v3/clientportal/chat`

Endpoints:
- `GET /health`
- `POST /sessions`
- `POST /sessions/:sessionId/close`
- `POST /sessions/:sessionId/chat` (SSE)

`/v3/clientportal/chat/conversations`

Endpoints:
- `GET /`
- `GET /:uid`
- `POST /`
- `PATCH /:uid`
- `DELETE /:uid`

## In Scope / Out of Scope

In scope:
- Only APIs currently implemented by `webaiwidgetmgr` and `webaiwidgetserver` listed above.

Out of scope:
- Any other `clientportal` domain APIs not implemented in those two services.
- Voice-calls API migration, unless later explicitly approved as part of this initiative.

## Domain Validity Check (`online_presence`)

From repository/tooling state:
- `swagger/online_presence` does not currently exist.
- `entities/online_presence` does not currently exist.
- existing workflow validator allowlist in `api-validation/scripts/validate-workflows.js` does not include `online_presence`.

Conclusion:
- `online_presence` may be valid in higher-level DDD governance, but it is **not currently enabled in this repo/tooling state**.
- Migration must start with domain enablement in `developers-hub`.

## Scope / Blast Radius

### Runtime services
- `webaiwidgetmgr`: controller base path + auth exclusions + tests + docs.
- `webaiwidgetserver`: chat/conversations controller base paths + tests + helper scripts/docs.

### API Gateway
- `apigw/src/config/conf.yaml` route mappings, whitelist paths, and introspection resources.

### Consumers / clients
- `frontage` (`webAIWidgetApiService` and tests).
- `livesitechatwidget` (`loader`, demo, streaming/chat integrations if path constants referenced).
- `webaiwidgetserver` internal references to `webaiwidgetmgr` endpoints (guidance utils).

### Documentation (`developers-hub`)
- Swagger:
  - `swagger/online_presence/widget_configurations.json`
  - `swagger/online_presence/chat.json`
- Entities:
  - `entities/online_presence/*` (widget + chat/conversation entity refs)
- Existing reports/plans referencing old domain naming.

## Proposed Target Namespace

If approved:
- `webaiwidgetmgr`: `/v3/online_presence/widget_configurations`
- `webaiwidgetserver` chat: `/v3/online_presence/chat` (sessions runtime kept as-is; internal/private docs)
- `webaiwidgetserver` conversations: `/v3/online_presence/chat_widget_conversations`

## Migration Strategy (Phased)

### Phase 0 - Domain Enablement in `developers-hub`
1. Confirm DDD governance approval that `online_presence` is the canonical domain.
2. Add `swagger/online_presence` and `entities/online_presence` structure.
3. Update validation/tooling domain allowlists and scripts that assume fixed domains.
4. Keep existing docs untouched until new domain is prepared.

Validation:
- repo scripts still run without domain validation errors.
- generated/unified swagger processes remain green.

### Phase 1 - Documentation Parity Under New Domain
1. Create `swagger/online_presence` specs for:
   - widget configurations
   - chat + conversations
2. Move/copy required entities to `entities/online_presence` and update `$ref` URLs.
3. Keep payload shapes identical (`{ success, data }`, `errors[]`, SSE exception) to avoid behavioral drift.

Validation:
- JSON validity checks for all new docs.
- strict contract review against current runtime behavior.

### Phase 2 - Runtime + Gateway Hard Cutover (No Backward Compatibility)
1. Add new `online_presence` routes in `webaiwidgetmgr` and `webaiwidgetserver`.
2. Remove old `clientportal` routes in the same release (immediate sunset).
3. Update `apigw` to route only new paths.
4. Update public/no-auth exclusions to only new paths.

Validation:
- Unit tests for the new route family.
- API smoke tests via APIGW on new paths only.
- Verify error semantics remain `400` vs `422` and envelope stays v3.

### Phase 3 - Consumer Cutover
1. Update all first-party consumers to call only `online_presence` paths.
2. Verify each integration end-to-end.

Validation:
- `frontage` tests.
- `livesitechatwidget` tests/build.
- `webaiwidgetserver` tests for guidance endpoint usage.
- no old path references in workspace.
- production/fenv smoke checks on final paths only.

## Risks
- Hidden consumer dependencies on old `clientportal` paths.
- Auth bypass/whitelist regressions on public widget config endpoints.
- One-shot cutover risk without fallback routes.

## Gaps & Open Issues
1. **Governance decision required:** Is `online_presence` officially approved as target DDD domain for these APIs?
2. **Tooling gap:** developers-hub validators currently do not treat `online_presence` as an allowed domain.
3. **Voice routes location (current state):** `v3/clientportal/chat/voicecalls/*` appears only as outbound calls in `voicecalls/src/utils/external-calls/WebaiwidgetserverService.ts` and as historical docs text in `webaiwidgetserver/docs/chat_conversations_storage_and_frontage_list.plan.md`; these routes are not currently implemented in `webaiwidgetserver/src` controllers and not configured in `apigw/src/config/conf.yaml`.
4. **Backward compatibility policy:** Confirmed by product request — immediate sunset, no legacy aliases.
5. **PR strategy:** Decide whether to deliver as one cross-repo wave or staged PRs (docs -> runtime/gateway hard cutover -> consumers -> cleanup).

## Recommended Execution Order
1. Approve governance/domain decision.
2. Enable `online_presence` in `developers-hub` tooling.
3. Publish docs under new domain.
4. Implement runtime + APIGW hard cutover (old paths removed in same release).
5. Cut over consumers and complete smoke validation.
