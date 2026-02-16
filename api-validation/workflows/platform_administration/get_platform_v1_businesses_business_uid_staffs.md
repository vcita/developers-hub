---
endpoint: "GET /platform/v1/businesses/{business_uid}/staffs"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/legacy_v1_platform.json"
status: verified
savedAt: "2026-01-27T09:23:39.591Z"
verifiedAt: "2026-01-27T09:23:39.591Z"
timesReused: 0
---

# Get Staffs

## Summary
Test passes with directory token. Returns staff list with HTTP 200. The endpoint requires directory-level permissions, not staff permissions.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_staffs
    method: GET
    path: "/platform/v1/businesses/{{business_uid}}/staffs"
    expect:
      status: [200, 201]
```
