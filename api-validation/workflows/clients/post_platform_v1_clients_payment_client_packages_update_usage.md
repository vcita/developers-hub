---
endpoint: POST /platform/v1/clients/payment/client_packages/update_usage
domain: clients
tags: []
status: skip
savedAt: 2026-01-23T22:47:22.342Z
verifiedAt: 2026-01-23T22:47:22.342Z
timesReused: 0
skipReason: Payment status 'ws9mhaosxmonz1ow' does not have an associated service that can use package credits. The endpoint correctly returns 'There is no package to use' when trying to redeem credits for payment statuses without payable services.
---
# Create Update usage

## Summary
Skipped based on cached workflow - Payment status 'ws9mhaosxmonz1ow' does not have an associated service that can use package credits. The endpoint correctly returns 'There is no package to use' when trying to redeem credits for payment statuses without payable services.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Payment status 'ws9mhaosxmonz1ow' does not have an associated service that can use package credits. The endpoint correctly returns 'There is no package to use' when trying to redeem credits for payment statuses without payable services.

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