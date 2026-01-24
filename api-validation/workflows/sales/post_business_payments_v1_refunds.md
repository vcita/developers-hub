---
endpoint: POST /business/payments/v1/refunds
domain: sales
tags: []
status: skip
savedAt: 2026-01-23T22:11:40.639Z
verifiedAt: 2026-01-23T22:11:40.639Z
timesReused: 0
skipReason: The original test payment (pli5xylerql8pwv1) was already in 'refunded' state, which correctly prevents additional refunds. Testing with a 'paid' payment (pjoy23s6g5yfr2fs) successfully created a refund, proving the endpoint works as intended.
---
# Create Refunds

## Summary
Skipped based on cached workflow - The original test payment (pli5xylerql8pwv1) was already in 'refunded' state, which correctly prevents additional refunds. Testing with a 'paid' payment (pjoy23s6g5yfr2fs) successfully created a refund, proving the endpoint works as intended.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

The original test payment (pli5xylerql8pwv1) was already in 'refunded' state, which correctly prevents additional refunds. Testing with a 'paid' payment (pjoy23s6g5yfr2fs) successfully created a refund, proving the endpoint works as intended.

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