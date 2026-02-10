---
endpoint: "POST /platform/v1/tokens"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/legacy_v1_platform.json"
status: verified
savedAt: "2026-01-30T10:00:00.000Z"
verifiedAt: "2026-01-30T10:00:00.000Z"
timesReused: 0
useFallbackApi: true
tokens: [staff, directory]
---

# Create Tokens

## Summary
Creates an authentication token for a business, application, or directory. At least one identifier must be provided. The created token can be used for API authentication or revoked using the `/tokens/revoke` endpoint. **Token Type**: Works with **staff** or **directory** tokens.

> ⚠️ Fallback API Required
> This endpoint requires the fallback API due to main gateway routing issues.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_tokens
    method: POST
    path: "/platform/v1/tokens"
    body:
      business_id: "{{business_id}}"
    expect:
      status: [200, 201]
```