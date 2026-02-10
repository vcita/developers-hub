---
endpoint: "PUT /v3/access_control/staff_business_roles/{staff_uid}"
domain: platform_administration
tags: [access_control, staff, business_roles]
swagger: "swagger/platform_administration/access_control.json"
status: pending
savedAt: "2026-02-10T05:14:52.000Z"
verifiedAt: "2026-02-10T05:14:52.000Z"
timesReused: 0
expectedOutcome: 403
expectedOutcomeReason: "The staff role configuration feature is disabled via feature flag 'staff_role_permissions'"
---

# Update Staff Business Roles

## Summary
Update the business role assigned to a staff member. **Token Type**: Requires a **staff token**.

> ⚠️ **Feature Flag Required**: This endpoint requires the `staff_role_permissions` feature flag to be enabled in the business configuration. When disabled, it returns 403 "The staff role configuration feature is disabled".

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

  - id: get_staff_business_roles
    description: "Get existing staff business role assignments"
    method: GET
    path: "/v3/access_control/staff_business_roles"
    extract:
      staff_uid: "$.data.staff_business_roles[0].staff_uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: put_staff_business_roles
    method: PUT
    path: "/v3/access_control/staff_business_roles/{{staff_uid}}"
    body:
      business_role_uid: "{{business_role_uid}}"
    expect:
      status: 403
```