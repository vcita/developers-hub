# WebAIWidgetServer API Doc Sync + Gap Analysis Plan

## Goal
- Align `developers-hub` docs with current `webaiwidgetserver` API contracts.
- Move docs closer to v3 standards where no backend code changes are required.
- Produce a follow-up gap report with suggested solutions for unresolved items.

## Scope
- Service codebase: `webaiwidgetserver` (`/src/chat`, `/src/conversations`).
- Docs: `swagger/clientportal/chat.json`, related entity schemas under `entities/clientportal/`.
- No backend code changes in this task.

## Steps
1. Inventory endpoints/controllers and request/response behavior from code.
2. Compare against developers-hub swagger/entity files.
3. Apply doc updates for clear mismatches and standards-safe fixes.
4. Validate JSON syntax and lints.
5. Create a dedicated gap analysis report with solution recommendations.

## Gaps & Open Issues
- v3 standardization items that conflict with actual runtime behavior (error envelope/status semantics) will be reported, not force-documented incorrectly.
- If domain/token governance standards conflict with existing published structure, document as governance gaps with decision options.
