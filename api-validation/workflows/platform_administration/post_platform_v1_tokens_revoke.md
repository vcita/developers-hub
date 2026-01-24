---
endpoint: POST /platform/v1/tokens/revoke
domain: platform_administration
tags: []
status: skip
savedAt: 2026-01-23T22:59:05.436Z
verifiedAt: 2026-01-23T22:59:05.436Z
timesReused: 0
skipReason: The endpoint requires a valid token that exists in the system. Using 'test_token_to_revoke' returns 422 'invalid token' because it doesn't exist. Using real tokens from GET /platform/v1/tokens successfully revokes them with 201 responses, but once revoked, they cannot be revoked again (though the API still returns success).
---
# Create Revoke

## Summary
Token revocation endpoint works correctly but test cannot pass with dummy token. The endpoint validates that the token exists in the system before revoking it.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

The endpoint requires a valid token that exists in the system. Using 'test_token_to_revoke' returns 422 'invalid token' because it doesn't exist. Using real tokens from GET /platform/v1/tokens successfully revokes them with 201 responses, but once revoked, they cannot be revoked again (though the API still returns success).

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/platform/v1/tokens/revoke",
  "body": {
    "token": "601bb35cc17d3aee57d80739832c0600e653854b72ba98800b80b08ab755b301"
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| token | Documentation doesn't explain that the token must be a valid existing token from the system. The example uses 'test_token_to_revoke' which will always fail with 422 'invalid token'. | Update documentation to explain that the token parameter must be a valid token obtained from GET /platform/v1/tokens, and provide an example showing how to get a real token first. Also document that 422 'invalid token' is expected for non-existent tokens. | major |