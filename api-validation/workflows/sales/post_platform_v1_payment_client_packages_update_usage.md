---
endpoint: POST /platform/v1/payment/client_packages/update_usage
domain: sales
tags: []
status: skip
savedAt: 2026-01-23T22:51:00.864Z
verifiedAt: 2026-01-23T22:51:00.864Z
timesReused: 0
skipReason: Payment status is not associated with a service booking - package credits can only be used for service appointments/bookings that are included in the package, not for invoice payments or package purchases themselves.
---
# Create Update usage

## Summary
Skipped based on cached workflow - Payment status is not associated with a service booking - package credits can only be used for service appointments/bookings that are included in the package, not for invoice payments or package purchases themselves.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Payment status is not associated with a service booking - package credits can only be used for service appointments/bookings that are included in the package, not for invoice payments or package purchases themselves.

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