---
endpoint: PUT /v3/operators/op_roles/{uid}
domain: platform_administration
tags: [operators]
status: skip
savedAt: 2026-01-28T20:24:13.804Z
verifiedAt: 2026-01-28T20:24:13.804Z
timesReused: 0
skipReason: The entire /v3/operators/* endpoint namespace appears to be missing from the actual API implementation, despite being documented in swagger. This is an infrastructure/implementation issue rather than a test data problem.
---
# Update Op roles

## Summary
User-approved skip: The entire /v3/operators/* endpoint namespace appears to be missing from the actual API implementation, despite being documented in swagger. This is an infrastructure/implementation issue rather than a test data problem.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

The entire /v3/operators/* endpoint namespace appears to be missing from the actual API implementation, despite being documented in swagger. This is an infrastructure/implementation issue rather than a test data problem.

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "PUT",
  "path": "/v3/operators/op_roles/{uid}"
}
```