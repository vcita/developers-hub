---
endpoint: "PUT /v3/business_administration/staff_members/{uid}"
domain: platform_administration
tags: [staff-only]
swagger: swagger/platform_administration/staff_member.json
status: success
savedAt: 2026-01-30T12:00:00.000Z
verifiedAt: 2026-01-30T12:00:00.000Z
---

# Update Staff members

## Summary
This endpoint allows staff members to update their own profile information using a Staff token. The `uid` must be the staff member's own UID (extracted from the token context or retrieved via GET endpoint).

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_staff_members
    method: PUT
    path: "/v3/business_administration/staff_members/{uid}"
    body:
      first_name: Updated
      display_name: Updated Display Name
    expect:
      status: [200, 201]
```
