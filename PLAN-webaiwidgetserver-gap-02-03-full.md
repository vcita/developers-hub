# Plan: WebAIWidgetServer GAP-02 + GAP-03 Implementation

## Objective
- Resolve **GAP-02**: unify v3 error response shape for `webaiwidgetserver` APIs.
- Resolve **GAP-03**: enforce clear status-code semantics (`400` malformed vs `422` validation/business-rule violations).
- Include deprecation/removal of legacy/root chat endpoints as part of the rollout scope.

## Implementation Status
- [x] v3-scoped exception filter implemented and applied to `ChatControllerV3` and `ConversationsController`.
- [x] Runtime status mapping aligned (`400` malformed syntax, `422` semantic/business-rule failures).
- [x] Legacy/root controller routes removed from runtime registration (`ChatController` removed from module).
- [x] Unit tests added/updated for filter behavior, status semantics, and module registration.
- [x] `developers-hub/swagger/online_presence/chat.json` updated to v3 error envelope + 422 responses/examples.
- [x] `REPORT-webaiwidgetserver-api-v3-gaps.md` updated with GAP-02 and GAP-03 closed.
- [ ] Post-change rollout checks completed in deployed environment (observability + client compatibility).

## In Scope
- Runtime API surface:
  - `/v3/clientportal/chat/*`
  - `/v3/clientportal/chat/conversations/*`
- Error contract standardization:
  - Return shape: `{ "success": false, "errors": [{ "field", "code", "message" }] }`
- Status code policy:
  - `400`: malformed request syntax or unsupported request format
  - `422`: semantic/validation/business-rule violations
- Legacy endpoint track:
  - Remove root + v1 routes from `chat.controller.ts` after deprecation checks
  - Keep only v3 controller routes

## Out of Scope
- Non-chat services and controllers outside `webaiwidgetserver`
- Feature behavior changes unrelated to error contract/validation semantics
- Changes to SSE success stream format (`text/event-stream`) beyond error handling

## Current State (Baseline)
- Current error responses are mostly Nest default shape (`statusCode/message/error`).
- Many validation/business failures currently return `400`.
- Service currently exposes both:
  - `ChatControllerV3` (`/v3/clientportal/chat...`)
  - `ChatController` (root health + legacy `/v1/sessions...`)

## Target State
- v3 chat/conversation JSON errors consistently return v3 error envelope.
- `400` vs `422` behavior is deterministic and documented.
- Legacy `v1` and root health endpoints removed from this service runtime.
- `developers-hub` swagger is fully aligned with implementation.

## Approved Defaults (Locked for Execution)
1. **422 classification policy**
   - `400` for malformed/unsupported syntax-level requests:
     - malformed JSON
     - invalid query/body format that cannot be parsed correctly
   - `422` for semantic validation and business-rule violations:
     - missing required business/domain fields (when request is syntactically valid)
     - invalid sort/value constraints
     - usage gate/app availability/domain validation rejections
2. **Filter scope**
   - Apply the new error mapper to **v3 endpoints first**:
     - `ChatControllerV3`
     - `ConversationsController`
   - Do not make it global in first rollout.
3. **Legacy route removal policy**
   - Remove legacy/root routes after traffic check window confirms no active usage:
     - `/v1/sessions*`, `/`, `/health`, `/health/check.json`
   - Keep `/v3/clientportal/chat/health` as the only health endpoint for this service API surface.
4. **JSON success envelope policy (updated)**
   - JSON success responses are standardized to `{ success: true, data: ... }`.
   - SSE success (`POST /v3/clientportal/chat/sessions/{sessionId}/chat`) remains `text/event-stream` by design.

---

## Implementation Plan

### Phase 1 - Contract design and mapping rules
1. Define canonical error mapping table for all known exception types:
   - `BadRequestException` from malformed syntax/parsing -> `400`
   - DTO/class-validator and domain validation errors -> `422`
   - `UnauthorizedException` -> `401`
   - `ForbiddenException` -> `403`
   - `NotFoundException` -> `404`
   - uncaught/unexpected -> `500` with safe generic message
2. Define `errors[]` normalization rules:
   - `field`: best-effort extraction from validation metadata; null/omitted when unknown
   - `code`: stable machine key (e.g. `invalid`, `required`, `forbidden`, `not_found`)
   - `message`: human-readable message
3. Confirm SSE endpoint behavior:
   - Keep `200 text/event-stream` success path unchanged
   - JSON errors should follow new envelope when thrown before stream starts

### Phase 2 - Runtime implementation
1. Add a centralized exception filter (or equivalent mapper) in `webaiwidgetserver`.
2. Scope initially to v3 controllers:
   - `ChatControllerV3`
   - `ConversationsController`
3. Integrate with bootstrap/module registration so v3 routes consistently use mapper.
4. Refactor known business-rule throws where needed to emit `422` instead of generic `400`.
5. Keep existing business logic unchanged except status/shape mapping.

### Phase 3 - Legacy and health endpoint removal
1. Verify zero external usage for legacy routes:
   - `/v1/sessions`
   - `/v1/sessions/:sessionId/chat`
   - `/v1/sessions/:sessionId/close`
   - root `/`, `/health`, `/health/check.json`
2. Ensure probes and infra use v3 health path only.
3. Remove `ChatController` from module controllers list and delete/retire legacy routes.
4. Keep `ChatControllerV3` health endpoint (`/v3/clientportal/chat/health`) as the only service health path for this API surface.

### Phase 4 - Tests and validation
1. Add/update tests for v3 error envelope:
   - sessions create (missing `business_uid`, app unavailable, usage gate)
   - conversations auth errors (`401/403`)
   - not found (`404`)
2. Add/update tests for `400` vs `422`:
   - malformed query/body -> `400`
   - semantic validation/business-rule failures -> `422`
3. Add negative tests confirming legacy routes are removed (expect `404`).
4. Run full relevant test suites and regression checks.

### Phase 5 - Documentation sync
1. Update `developers-hub/swagger/online_presence/chat.json`:
   - Replace `NestHttpException` usage with v3 `ErrorResponse` schema on v3 routes
   - Add/adjust 422 responses where applicable
   - Remove legacy/root route references if present
2. Update gap report (`REPORT-webaiwidgetserver-api-v3-gaps.md`) to close GAP-02 and GAP-03.

---

## API Validation Matrix (must pass)
- `POST /v3/clientportal/chat/sessions`
  - malformed body -> `400` v3 error envelope
  - business rule/validation failure -> `422` v3 error envelope
- `POST /v3/clientportal/chat/sessions/{sessionId}/chat`
  - empty message -> `422` v3 error envelope (semantic validation)
- `GET/POST/PATCH /v3/clientportal/chat/conversations...`
  - auth failure `401/403` -> v3 envelope
  - not found `404` -> v3 envelope
  - validation failure `422` -> v3 envelope
- Legacy endpoints:
  - `/v1/sessions*`, `/health`, `/health/check.json` -> removed/unavailable as designed

## Rollout and Safety
- Deploy behind normal release process with monitoring of:
  - response status distribution (`400/401/403/404/422/500`)
  - error payload parse issues in consumers
  - sudden 404 spikes on legacy endpoints
- Rollback plan:
  - Re-enable previous controller registration and previous exception mapping behavior if consumer breakage is detected

## Remaining Tracking Items (Post-Implementation)
1. **Legacy route removal impact monitoring**
   - Watch APIGW/runtime metrics for 404 spikes on removed routes:
     - `/v1/sessions*`, `/`, `/health`, `/health/check.json`
2. **Consumer compatibility verification**
   - Confirm no clients rely on old Nest error shape (`statusCode/message/error`) after rollout.
3. **GAP-01 follow-up**
   - Completed in a later pass: JSON success responses migrated to standard v3 envelope; SSE kept as explicit stream exception.

## Deliverables
- Runtime:
  - exception mapping implementation
  - status classification updates
  - legacy controller removal
- Tests:
  - updated/added coverage for envelope + status semantics + route removal
- Docs:
  - synced swagger changes
  - updated gap report with GAP-02 and GAP-03 closed
