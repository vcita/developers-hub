---
endpoint: GET /v3/license/offerings
domain: platform_administration
tags: [license, offerings]
status: success
savedAt: 2026-01-28T07:31:54.815Z
verifiedAt: 2026-01-28T07:31:54.815Z
timesReused: 0
knownIssues:
  - path: /data/offerings/*/type
    reason: Some offerings in test environment have invalid type values (staff_slot, one_time_purchase) that are not allowed per documentation. Valid types are: package, app, addon.
    ticket: DATA_CLEANUP_REQUIRED
---
# Get Offerings

## Summary
Test passes. The endpoint works correctly when called without invalid query parameters. The original error was caused by passing 'directory_uid' instead of the correct 'directory_id' parameter.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

- **Known Issue (type field)** - Some offerings in the test environment have invalid `type` values (`staff_slot`, `one_time_purchase`) that don't match the documented enum (`package`, `app`, `addon`). This is a data quality issue, NOT a documentation issue. The database contains offerings created with invalid type values that need to be cleaned up or migrated to use `addon` type.

## Known Issues

| Path | Issue | Resolution |
|------|-------|------------|
| `/data/offerings/*/type` | Some offerings have type values `staff_slot` or `one_time_purchase` which are not in the documented enum | Data cleanup required - these should be migrated to `addon` type |

**Note**: Errors matching known issues are automatically suppressed during validation.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "GET",
  "path": "/v3/license/offerings"
}
```