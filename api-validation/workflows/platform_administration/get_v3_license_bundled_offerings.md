---
endpoint: "GET /v3/license/bundled_offerings"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/license.json"
status: verified
savedAt: "2026-01-28T07:29:39.800Z"
verifiedAt: "2026-01-28T07:29:39.800Z"
timesReused: 0
---

# Get Bundled offerings

## Summary
Test passes successfully. The GET /v3/license/bundled_offerings endpoint works correctly with directory token and returns bundled offerings data.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_bundled_offerings
    method: GET
    path: "/v3/license/bundled_offerings"
    expect:
      status: [200, 201]
```
