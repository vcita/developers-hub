---
endpoint: "POST /v3/access_control/staff_business_roles"
domain: platform_administration
tags: [access_control, staff, business_roles]
swagger: "swagger/platform_administration/access_control.json"
status: verified
savedAt: "2026-02-10T05:08:00.000Z"
verifiedAt: "2026-02-10T05:08:00.000Z"
timesReused: 0
---

# Create Staff Business Role Assignment

## Summary
Creates a new staff business role assignment. **Token Type**: Requires a **staff token**.

## Prerequisites

```yaml
steps:
  - id: get_business_roles
    description: "Get available business roles"
    method: GET
    path: "/v3/access_control/business_roles"
    extract:
      business_role_uid: "$.data.business_roles[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: create_staff_business_role
    method: POST
    path: "/v3/access_control/staff_business_roles"
    body:
      staff_uid: "invalid_uid"
      business_role_uid: "{{business_role_uid}}"
    expect:
      status: 400
```