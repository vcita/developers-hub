---
endpoint: "POST /platform/v1/tokens/revoke"
domain: platform_administration
tags: [tokens]
swagger: swagger/platform_administration/legacy/legacy_v1_platform.json
status: verified
savedAt: 2026-01-30T21:28:12.398Z
verifiedAt: 2026-01-30T21:28:12.398Z
timesReused: 0
tokens: [staff]
---

# Revoke Token

## Summary
Revokes an authentication token that was previously created. The token becomes invalid after revocation. **Token Type**: Requires a **staff token**.

> This endpoint requires the fallback API due to main gateway routing issues.

## Prerequisites
```yaml
steps:
  - id: create_token
    description: "Create a token to revoke"
    method: POST
    path: "/platform/v1/tokens"
    body:
      business_id: "{{business_id}}"
    extract:
      token_to_revoke: "$.data.token"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: main_request
    method: POST
    path: "/platform/v1/tokens/revoke"
    body:
      token: "{{token_to_revoke}}"
    expect:
      status: [200, 201]
```