---
endpoint: "PUT /v3/access_control/staff_permission_overrides_lists/{staff_uid}"
domain: platform_administration
tags: [access_control, permissions]
swagger: "swagger/platform_administration/access_control.json"
status: verified
savedAt: 2026-02-10T16:41:15.000Z
verifiedAt: 2026-02-10T16:41:15.000Z
timesReused: 0
---

# Update Staff permission overrides lists

## Summary
Update permission overrides for a staff member. **Token Type**: Requires a **staff token**.

## Prerequisites

```yaml
steps:
  - id: get_staff_business_roles
    description: "Get a staff member with business role assignment"
    method: GET
    path: "/v3/access_control/staff_business_roles"
    params:
      per_page: "1"
    extract:
      staff_uid: "$.data.staff_business_roles[0].staff_uid"
    expect:
      status: 200
    onFail: abort

  - id: get_business_role
    description: "Get business role to find valid permission keys"
    method: GET
    path: "/v3/access_control/business_roles"
    params:
      per_page: "1"
    extract:
      permission_key: "$.data.business_roles[0].permissions[0].key"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    method: PUT
    path: "/v3/access_control/staff_permission_overrides_lists/{{staff_uid}}"
    body:
      permissions:
        - key: "{{permission_key}}"
          state: "allow"
    expect:
      status: 200
```