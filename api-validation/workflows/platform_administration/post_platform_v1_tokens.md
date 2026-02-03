---
endpoint: "POST /platform/v1/tokens"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/legacy/legacy_v1_platform.json
status: success
savedAt: 2026-01-30T10:00:00.000Z
verifiedAt: 2026-01-30T10:00:00.000Z
---

# Create Tokens

## Summary
Creates an authentication token for a business, application, or directory. At least one identifier must be provided. The created token can be used for API authentication or revoked using the `/tokens/revoke` endpoint.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_tokens
    method: POST
    path: "/platform/v1/tokens"
    body:
      business_id: "{{config.business_id}}"
    expect:
      status: [200, 201]
```
