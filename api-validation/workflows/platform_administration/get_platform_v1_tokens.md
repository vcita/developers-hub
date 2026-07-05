---
endpoint: "GET /platform/v1/tokens"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/legacy_v1_platform.json"
status: verified
savedAt: "2026-01-27T14:32:15.398Z"
verifiedAt: "2026-01-27T14:32:15.398Z"
timesReused: 0
tokens: [staff, directory]
---

# Get Tokens

## Summary
GET /platform/v1/tokens retrieves token information. **Token Type**: Works with **staff** or **directory** tokens.

> This endpoint requires the fallback API due to main gateway routing issues.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_tokens
    method: GET
    path: "/platform/v1/tokens"
    expect:
      status: [200, 201]
```