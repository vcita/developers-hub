## Goal
Align Web AI Widget API documentation files with the `online_presence` domain folder structure in `developers-hub`.

## Implementation Plan
1. Create `swagger/online_presence/` files for chat and widget configuration APIs.
2. Create `entities/online_presence/` entity files currently under `entities/clientportal/` and `entities/web_ai_widget/`.
3. Update all `$ref` links in migrated Swagger files to point to `entities/online_presence/...`.
4. Remove outdated `swagger/clientportal/chat.json`, `swagger/web_ai_widget/widget_configurations.json`, `entities/clientportal/*`, and `entities/web_ai_widget/*` files tied to these APIs.
5. Run validation checks (`unify` dry-run + focused searches) and fix any path regressions.

## Gaps & Open Issues
- `online_presence` is not currently listed in some internal validation tooling domain lists; this may require follow-up tooling updates if strict domain validators are used.
- Need to confirm desired final Swagger path for widget config (`swagger/online_presence/web_ai_widget/widget_configurations.json` vs flattened naming under `swagger/online_presence/`).
