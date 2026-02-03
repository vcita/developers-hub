---
endpoint: "GET /business/accounts/v1/identities"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/legacy/accounts.json
status: success
savedAt: 2026-01-29T07:57:42.792Z
verifiedAt: 2026-01-29T07:57:42.792Z
---

# Get Identities

## Summary
Endpoint works correctly with directory token and X-On-Behalf-Of header. The 500 error was caused by using the wrong authentication method.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_identities
    method: GET
    path: "/business/accounts/v1/identities"
    expect:
      status: [200, 201]
```
