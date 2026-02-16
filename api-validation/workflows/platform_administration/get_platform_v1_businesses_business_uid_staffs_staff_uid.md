---
endpoint: "GET /platform/v1/businesses/{business_uid}/staffs/{staff_uid}"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/legacy_v1_platform.json"
status: verified
savedAt: "2026-01-27T09:24:06.431Z"
verifiedAt: "2026-01-27T09:24:06.431Z"
timesReused: 0
---

# Get Staffs

## Summary
Test passes with directory token and valid staff ID. Original failure was due to: 1) Wrong token type (used default instead of directory), 2) Invalid staff_id (0fdf1a4928dc79b3 doesn't exist in this business).

## Prerequisites

```yaml
steps:
  - id: get_staffs
    description: "Fetch available staff members"
    method: GET
    path: "/platform/v1/businesses/{{business_id}}/staffs"
    params:
      per_page: "1"
    extract:
      staff_id: "$.data.staffs[0].uid"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_staffs
    method: GET
    path: "/platform/v1/businesses/{{business_uid}}/staffs/{{staff_uid}}"
    expect:
      status: [200, 201]
```
