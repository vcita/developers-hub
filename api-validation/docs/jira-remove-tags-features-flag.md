# JIRA Ticket: Remove redundant tags_features feature flag

**Create this ticket in JIRA** (e.g. under VCITA or your API/docs project). MCP was not available to create it automatically.

---

## Summary

Remove redundant `tags_features` feature flag from codebase.

## Description

The feature flag **tags_features** is redundant. The packagable flag that controls tags functionality is **tags_feature** (see api-validation/docs/packagable-feature-flags.md). The redundant flag should be removed from:

- Any controllers or services that check `tags_features`
- Feature-flag configuration or constants
- Tests or docs that reference `tags_features`

**Scope:** Code and config only. Do not remove **tags_feature** (the packagable one).

**Reference:** API validation / packagable feature flags doc: only packagable flags should be documented; redundant flags should be removed via engineering work.

## Acceptance criteria

- [ ] All references to `tags_features` (with 's') removed from codebase
- [ ] No behavior change for tags functionality (tags_feature remains)
- [ ] No documentation or API contract changes required

## Epic / Link

Associate with epic: https://myvcita.atlassian.net/browse/VCITA2-11611 (if applicable)

## Labels (suggested)

feature-flag, cleanup, tech-debt
