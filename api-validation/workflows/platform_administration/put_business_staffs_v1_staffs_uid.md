---
endpoint: "PUT /business/staffs/v1/staffs/{uid}"
domain: platform_administration
tags: [directory-only]
swagger: swagger/platform_administration/legacy/staff.json
status: success
savedAt: 2026-01-29T12:00:00.000Z
verifiedAt: 2026-01-29T12:00:00.000Z
---

# Update Staffs

## Summary
This endpoint is for **Directory tokens only** to update staff members in managed businesses. Staff members who want to update their own details should use `PUT /v3/business_administration/staff_members/{uid}` with a Staff token instead.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_staffs
    method: PUT
    path: "/business/staffs/v1/staffs/{uid}"
    body:
      staff:
        display_name: Test Staff Updated
    expect:
      status: [200, 201]
```
