# Widget Configuration API: Doc Sync + Code Gap Plan

## Goal
- Align `developers-hub` docs with the current `webaiwidgetmgr` API behavior where no backend code change is required.
- Produce a clear implementation plan for remaining v3 gaps that require code changes.

## Scope
- Update `swagger/online_presence/widget_configurations.json` only.
- Keep service/runtime behavior unchanged.
- No commit/push in this task.

## Implementation Steps
1. Validate current runtime contract from controller/service:
   - Confirm endpoints, auth requirements, params, and response media types.
2. Update swagger to match runtime behavior:
   - Add missing `GET /v3/clientportal/web_ai_widget/widget_configurations/public` endpoint (`business_uid` query).
   - Fix `GET /ai_guidance` security and error responses to match business-auth requirement.
3. Re-read updated swagger to ensure JSON validity and consistency with existing style.
4. Prepare code-change gap plan (separate from doc-only changes):
   - List each gap that cannot be solved by docs only.
   - Propose concrete code + docs steps per gap.

## Gaps & Open Issues
- `web_ai_widget` domain naming vs current v3 standards list is a governance mismatch and may require org-level decision.
- Error envelope semantics (`NestHttpException` vs standardized v3 `ErrorResponse`) likely need code-level normalization if strict v3 compliance is required.
- Token taxonomy in API behavior/docs currently depends on Business-token semantics; strict alignment with v3 token categories may require auth-layer changes.
