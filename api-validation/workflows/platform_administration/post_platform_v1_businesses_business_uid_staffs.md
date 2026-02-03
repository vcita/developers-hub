---
endpoint: "POST /platform/v1/businesses/{business_uid}/staffs"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/legacy/legacy_v1_platform.json
status: success
savedAt: 2026-01-29T08:58:08.693Z
verifiedAt: 2026-01-29T08:58:08.693Z
---

# Create Staffs

## Summary
Creates a new staff member for a business. The email must be unique across the entire platform.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_staffs
    method: POST
    path: "/platform/v1/businesses/{business_uid}/staffs"
    body:
      meta:
        invite: false
      staff:
        display_name: Test Staff
        email: test.staff.{timestamp}@example.com
        first_name: Test
        last_name: Staff
        role: user
    expect:
      status: [200, 201]
```
