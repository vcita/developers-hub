---
endpoint: "GET /v3/business_administration/staff_members/{uid}"
domain: platform_administration
tags: [staff-only]
swagger: "swagger/platform_administration/staff_member.json"
status: verified
savedAt: "2026-02-09T22:56:30.000Z"
verifiedAt: "2026-02-09T22:56:30.000Z"
timesReused: 0
useFallbackApi: true
---

# Get Staff Member

## Summary
This endpoint retrieves a specific staff member's information using their UID. **Token Type**: Requires a **staff token**.

> ⚠️ **Fallback API Required**

## Prerequisites

```yaml
steps:
  - id: get_staff_list
    description: "Get list of staff members to extract a UID"
    method: GET
    path: "/v2/staffs"
    extract:
      staff_uid: "$.data[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_staff_member
    method: GET
    path: "/v3/business_administration/staff_members/{{staff_uid}}"
    expect:
      status: [200, 201]
```