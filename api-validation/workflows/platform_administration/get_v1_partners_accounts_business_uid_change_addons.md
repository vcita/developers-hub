---
endpoint: "GET /v1/partners/accounts/{business_uid}/change_addons"
domain: platform_administration
tags: [partners, change-addons]
swagger: "swagger/platform_administration/legacy/partners-api.json"
status: skipped
savedAt: "2026-01-31T12:41:58.412Z"
verifiedAt: "2026-01-31T12:41:58.412Z"
timesReused: 0
---

# Get Change addons

## Summary
User-approved skip: Endpoint appears unreachable via API gateway (Bad Gateway) and not routed on fallback host. This looks like infrastructure/routing config issue rather than request/data issue; cannot proceed with functional test until routing is fixed.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_change_addons
    method: GET
    path: "/v1/partners/accounts/{{business_uid}}/change_addons"
    expect:
      status: [200, 201]
```
