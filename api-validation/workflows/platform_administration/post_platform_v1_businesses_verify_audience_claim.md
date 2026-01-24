---
endpoint: POST /platform/v1/businesses/verify_audience_claim
domain: platform_administration
tags: []
status: pass
savedAt: 2026-01-23T15:57:07.464Z
verifiedAt: 2026-01-23T15:57:07.464Z
timesReused: 0
---
# Create Verify audience claim

## Summary
Endpoint works correctly when using proper request format. The error was caused by incorrect parameter type in documentation.

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

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| unique_validation_identifier | Documentation specifies parameter type as 'object' but API expects a string value | Change swagger schema from 'type: object' to 'type: string' and update description to specify it should be an email address or identifier string | critical |
| Authorization | Documentation doesn't specify that this endpoint requires a Directory token (not Business token) | Add clarification that Authorization header must use a Directory API token | major |