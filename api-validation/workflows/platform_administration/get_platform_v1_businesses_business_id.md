---
endpoint: "GET /platform/v1/businesses/{business_uid}"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/legacy_v1_platform.json"
status: verified
savedAt: "2026-01-27T09:21:27.777Z"
verifiedAt: "2026-01-27T09:21:27.777Z"
timesReused: 0
---

# Get Businesses

## Summary
Test passes with directory token. The GET /platform/v1/businesses/{business_id} endpoint requires directory-level permissions and returns detailed business information including admin account details and business metadata.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_businesses
    method: GET
    path: "/platform/v1/businesses/{{business_uid}}"
    expect:
      status: [200, 201]
```
