---
endpoint: "POST /platform/v1/businesses/{business_id}/staffs"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/legacy_v1_businesses.json"
status: verified
savedAt: "2026-01-29T07:56:36.053Z"
verifiedAt: "2026-01-29T07:56:36.053Z"
timesReused: 0
---

# Create Staffs

## Summary
Successfully created staff member after resolving authentication and validation issues

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_staffs
    method: POST
    path: "/platform/v1/businesses/{{business_id}}/staffs"
    body:
      meta:
        invite: true
      staff:
        email: test.staff.{{timestamp}}@example.com
        display_name: Test Staff {{timestamp}}
        first_name: Test
        last_name: Staff
        role: user
    expect:
      status: [200, 201]
```
