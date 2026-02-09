---
endpoint: "POST /platform/v1/tokens/revoke"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/legacy_v1_platform.json"
status: verified
savedAt: "2026-01-28T11:17:36.085Z"
verifiedAt: "2026-01-28T11:17:36.085Z"
timesReused: 0
---

# Create Revoke

## Summary
The endpoint works correctly. The original error was due to using a fake JWT token that doesn't exist in the system. When provided with a valid token created via POST /platform/v1/tokens, the revocation succeeds and returns HTTP 201.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_revoke
    method: POST
    path: "/platform/v1/tokens/revoke"
    body:
      token: "{{token}}"
    expect:
      status: [200, 201]
```
