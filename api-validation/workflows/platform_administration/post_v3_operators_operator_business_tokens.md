---
endpoint: POST /v3/operators/operator_business_tokens
domain: platform_administration
tags: [operators]
status: skip
savedAt: 2026-01-28T09:50:05.794Z
verifiedAt: 2026-01-28T09:50:05.794Z
timesReused: 0
skipReason: The endpoint POST /v3/operators/operator_business_tokens returns 404 Not Found, and the swagger documentation explicitly warns that it 'may not be implemented'. The alternative endpoint POST /v3/operators/operator_tokens exists but requires different authentication/authorization that cannot be resolved in this test environment.
---
# Create Operator business tokens

## Summary
User-approved skip: The endpoint POST /v3/operators/operator_business_tokens returns 404 Not Found, and the swagger documentation explicitly warns that it 'may not be implemented'. The alternative endpoint POST /v3/operators/operator_tokens exists but requires different authentication/authorization that cannot be resolved in this test environment.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

The endpoint POST /v3/operators/operator_business_tokens returns 404 Not Found, and the swagger documentation explicitly warns that it 'may not be implemented'. The alternative endpoint POST /v3/operators/operator_tokens exists but requires different authentication/authorization that cannot be resolved in this test environment.

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
  "method": "POST",
  "path": "/v3/operators/operator_business_tokens"
}
```