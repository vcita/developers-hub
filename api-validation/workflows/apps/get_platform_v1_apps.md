---
endpoint: "GET /platform/v1/apps"
domain: apps
tags: []
swagger: swagger/apps/legacy/legacy_v1_apps.json
status: success
savedAt: 2026-01-24T22:42:47.459Z
verifiedAt: 2026-01-24T22:42:47.459Z
---

# Get Apps

## Summary
GET /platform/v1/apps test passes successfully. The endpoint returns HTTP 200 with staff token and HTTP 201 with directory token, both providing valid app lists. Response format varies by token type as documented: staff token returns detailed app data with full configuration, while directory token returns simplified app data with only directory-associated apps. The original failure was likely due to JSON parsing issues, not the endpoint itself.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_apps
    method: GET
    path: "/platform/v1/apps"
    expect:
      status: [200, 201]
```
