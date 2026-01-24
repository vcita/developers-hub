---
endpoint: POST /v3/reviews/business_reviews_settings
domain: reviews
tags: []
status: skip
savedAt: 2026-01-23T23:01:40.549Z
verifiedAt: 2026-01-23T23:01:40.549Z
timesReused: 0
skipReason: Business reviews settings already exist for business pihawe0kf7fu7xo1 - each business can only have one set of review settings. The endpoint correctly enforces this constraint by returning HTTP 409 and directing to use PUT /v3/reviews/business_reviews_settings/{business_uid} instead.
---
# Create Business reviews settings

## Summary
Skipped based on cached workflow - Business reviews settings already exist for business pihawe0kf7fu7xo1 - each business can only have one set of review settings. The endpoint correctly enforces this constraint by returning HTTP 409 and directing to use PUT /v3/reviews/business_reviews_settings/{business_uid} instead.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Business reviews settings already exist for business pihawe0kf7fu7xo1 - each business can only have one set of review settings. The endpoint correctly enforces this constraint by returning HTTP 409 and directing to use PUT /v3/reviews/business_reviews_settings/{business_uid} instead.

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