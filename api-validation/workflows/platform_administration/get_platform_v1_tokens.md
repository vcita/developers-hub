---
endpoint: "GET /platform/v1/tokens"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/legacy/legacy_v1_platform.json
status: success
savedAt: 2026-01-27T09:26:16.136Z
verifiedAt: 2026-01-27T09:26:16.136Z
---

# Get Tokens

## Summary
Test passes with directory token. GET /platform/v1/tokens requires directory-level authentication and returns a list of directory tokens.

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
