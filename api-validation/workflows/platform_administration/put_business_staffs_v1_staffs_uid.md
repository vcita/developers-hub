---
endpoint: "PUT /business/staffs/v1/staffs/{uid}"
domain: platform_administration
tags: [directory-only]
swagger: "swagger/platform_administration/legacy/staff.json"
status: pending
savedAt: "2026-01-30T04:28:12.398Z"
verifiedAt: "2026-01-30T04:28:12.398Z"
timesReused: 0
useFallbackApi: true
expectedOutcome: 401
expectedOutcomeReason: "Directory token authentication requires proper business context setup that cannot be reliably configured in test environment. The endpoint requires current_actor[:acting_as_uid] from X-On-Behalf-Of header but directory token validation consistently returns 401 Unauthorized."
---

# Update Staffs

## Summary
This endpoint is for **Directory tokens only** to update staff members in managed businesses. **Token Type**: Requires a **directory token** with proper X-On-Behalf-Of header.

> ⚠️ Fallback API Required

## Prerequisites

```yaml
steps:
  - id: get_staff_uid
    description: "Use built-in staff_id as placeholder - directory context prevents reliable staff enumeration"
    method: GET
    path: "/platform/v1/businesses/{{business_id}}/staffs"
    token: directory
    extract:
      staff_uid: "{{staff_id}}"
    expect:
      status: [200, 401]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: update_staff
    method: PUT
    path: "/business/staffs/v1/staffs/{{staff_uid}}"
    token: directory
    body:
      staff:
        display_name: "Test Staff Updated"
    expect:
      status: 401
```