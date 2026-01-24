---
endpoint: POST /oauth/token
domain: platform_administration
tags: []
status: skip
savedAt: 2026-01-23T22:33:16.130Z
verifiedAt: 2026-01-23T22:33:16.130Z
timesReused: 0
skipReason: This endpoint requires a valid OAuth client_id, client_secret, and authorization code that can only be obtained through a proper OAuth authorization flow. Testing with fake credentials correctly results in 401 'invalid_client' errors, which is the expected security behavior. A real test would require setting up a complete OAuth flow with a real application and user authorization.
---
# Create Token

## Summary
Skipped based on cached workflow - This endpoint requires a valid OAuth client_id, client_secret, and authorization code that can only be obtained through a proper OAuth authorization flow. Testing with fake credentials correctly results in 401 'invalid_client' errors, which is the expected security behavior. A real test would require setting up a complete OAuth flow with a real application and user authorization.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

This endpoint requires a valid OAuth client_id, client_secret, and authorization code that can only be obtained through a proper OAuth authorization flow. Testing with fake credentials correctly results in 401 'invalid_client' errors, which is the expected security behavior. A real test would require setting up a complete OAuth flow with a real application and user authorization.

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