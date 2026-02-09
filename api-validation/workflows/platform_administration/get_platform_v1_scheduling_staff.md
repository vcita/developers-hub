---
endpoint: "GET /platform/v1/scheduling/staff"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/legacy_v1_platform.json"
status: verified
savedAt: "2026-01-27T09:25:36.268Z"
verifiedAt: "2026-01-27T09:25:36.268Z"
timesReused: 0
---

# Get Staff

## Summary
Test passes after discovering required query parameters. Endpoint requires business_id and only_active_services parameters, and needs directory token authentication.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_staff
    method: GET
    path: "/platform/v1/scheduling/staff"
    expect:
      status: [200, 201]
```
