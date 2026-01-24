---
endpoint: POST /v3/communication/business_phone_numbers
domain: communication
tags: []
status: skip
savedAt: 2026-01-23T22:24:12.096Z
verifiedAt: 2026-01-23T22:24:12.096Z
timesReused: 0
skipReason: Business does not have a valid 'callsandtexting' app subscription, which is required to claim phone numbers with VOICE and SMS features. This is a business/licensing constraint, not a technical issue with the endpoint.
---
# Create Business phone numbers

## Summary
Skipped - Business lacks required app installation for phone number features

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Business does not have a valid 'callsandtexting' app subscription, which is required to claim phone numbers with VOICE and SMS features. This is a business/licensing constraint, not a technical issue with the endpoint.

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