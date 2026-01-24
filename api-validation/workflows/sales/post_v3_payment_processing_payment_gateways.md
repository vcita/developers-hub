---
endpoint: POST /v3/payment_processing/payment_gateways
domain: sales
tags: []
status: skip
savedAt: 2026-01-23T22:34:23.552Z
verifiedAt: 2026-01-23T22:34:23.552Z
timesReused: 0
skipReason: Business constraint: Only one payment gateway can exist per app, and the authenticated app 'tips' already has a gateway. The endpoint requires app_code_name to match the authenticated app, creating a constraint that prevents testing with arbitrary values.
---
# Create Payment gateways

## Summary
Skipped based on cached workflow - Business constraint: Only one payment gateway can exist per app, and the authenticated app 'tips' already has a gateway. The endpoint requires app_code_name to match the authenticated app, creating a constraint that prevents testing with arbitrary values.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Business constraint: Only one payment gateway can exist per app, and the authenticated app 'tips' already has a gateway. The endpoint requires app_code_name to match the authenticated app, creating a constraint that prevents testing with arbitrary values.

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