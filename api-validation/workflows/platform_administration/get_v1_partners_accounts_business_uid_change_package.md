---
endpoint: "GET /v1/partners/accounts/{business_uid}/change_package"
domain: platform_administration
tags: [partners, change-package]
swagger: "swagger/platform_administration/legacy/partners-api.json"
status: skipped
savedAt: "2026-01-31T12:41:23.206Z"
verifiedAt: "2026-01-31T12:41:23.206Z"
timesReused: 0
---

# Get Change package

## Summary
User-approved skip: Infrastructure/gateway routing issue: primary returns 'Bad Gateway' and fallback returns 404; endpoint implementation cannot be reached to validate behavior.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_change_package
    method: GET
    path: "/v1/partners/accounts/{{business_uid}}/change_package"
    expect:
      status: [200, 201]
```
