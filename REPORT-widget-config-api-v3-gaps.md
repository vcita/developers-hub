# Widget Configuration API vs API v3 Standards - Gap Report

## Scope
- Compared `webaiwidgetmgr` widget configuration API behavior and `developers-hub` contract docs against current v3 standards/skills.
- Sources reviewed:
  - `webaiwidgetmgr` controller/services/DTO behavior
  - `developers-hub/swagger/web_ai_widget/widget_configurations.json`
  - `developers-hub/entities/web_ai_widget/*.json`
  - v3 skills and standards notes (`ddd-v3`, `sync-developers-hub`, API/entity v3 guidelines)

## Executive Summary
- **Still open (docs/governance):** 0 gaps
- **Require backend/auth/error code changes:** 0 gaps

---

## Gap List

### GAP-01: Endpoint taxonomy outside `clientportal` domain
- **Type:** Governance/structure gap
- **Status:** Closed
- **Resolution:** Widget configuration endpoints were moved from `/v3/web_ai_widget/widget_configurations` to `/v3/clientportal/web_ai_widget/widget_configurations` across service runtime, APIGW routing, consumers, and Swagger path definitions.

### GAP-02: Error response contract not v3-standardized at runtime
- **Type:** Code + contract gap
- **Status:** Closed
- **Resolution:** Added a v3 exception filter in `webaiwidgetmgr` widget-configuration API surface and normalized runtime errors to `{ success: false, errors[] }`. Swagger error schemas/examples were aligned to v3 envelope shape.

### GAP-03: Validation status code semantics (`400` vs `422`)
- **Type:** Code + contract gap
- **Status:** Closed
- **Resolution:** Semantic validation/business-rule failures were moved to `422` (`UnprocessableEntityException`) for widget-configuration APIs, while malformed JSON remains `400` via exception filter mapping.

---

## Recommended Execution Order
1. **Final sync pass:** keep developers-hub docs and examples aligned after further endpoint evolution.

## Notes
- This report intentionally separates **documentation-only** gaps from **code-required** gaps.
