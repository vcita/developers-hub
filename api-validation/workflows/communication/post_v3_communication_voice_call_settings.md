---
endpoint: POST /v3/communication/voice_call_settings
domain: communication
tags: []
status: skip
savedAt: 2026-01-23T22:25:29.824Z
verifiedAt: 2026-01-23T22:25:29.824Z
timesReused: 0
skipReason: Staff already has voice call settings configured - the API returned 409 Conflict indicating a unique constraint. Each staff member can only have one voice call setting configuration.
---
# Create Voice call settings

## Summary
Skipped based on cached workflow - Staff already has voice call settings configured - the API returned 409 Conflict indicating a unique constraint. Each staff member can only have one voice call setting configuration.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Staff already has voice call settings configured - the API returned 409 Conflict indicating a unique constraint. Each staff member can only have one voice call setting configuration.

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