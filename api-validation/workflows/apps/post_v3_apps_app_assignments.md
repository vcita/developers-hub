---
endpoint: POST /v3/apps/app_assignments
domain: apps
tags: []
status: skip
savedAt: 2026-01-23T21:48:36.143Z
verifiedAt: 2026-01-23T21:48:36.143Z
timesReused: 0
skipReason: The endpoint properly enforces authorization rules requiring either 'admin' or 'directory' token types. Current test environment only provides business/staff-level tokens. This is a valid business constraint - app assignments should only be managed by administrators or directory-level users.
---
# Create App assignments

## Summary
Skipped based on cached workflow - The endpoint properly enforces authorization rules requiring either 'admin' or 'directory' token types. Current test environment only provides business/staff-level tokens. This is a valid business constraint - app assignments should only be managed by administrators or directory-level users.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

The endpoint properly enforces authorization rules requiring either 'admin' or 'directory' token types. Current test environment only provides business/staff-level tokens. This is a valid business constraint - app assignments should only be managed by administrators or directory-level users.

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
null
```

## Documentation Fix Suggestions

No documentation issues found.