---
endpoint: "PUT /v3/access_control/business_roles/{uid}"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/access_control.json"
status: pending
savedAt: 2026-02-09T23:24:42.000Z
verifiedAt: 2026-02-09T23:24:42.000Z
timesReused: 0
expectedOutcome: 403
expectedOutcomeReason: "Feature flag 'staff_role_permissions' is disabled in the environment, causing all business role write operations to return 403 'The staff role configuration feature is disabled'"
---

# Update Business roles

## Summary
Updates an existing business role by UID. **Token Type**: Requires a **staff token**.

> ⚠️ **Feature Flag Required**: This endpoint requires the `staff_role_permissions` feature flag to be enabled. When disabled, it returns 403 "The staff role configuration feature is disabled".

## Prerequisites

```yaml
steps:
  - id: get_business_role
    description: "Fetch an existing business role"
    method: GET
    path: "/v3/access_control/business_roles"
    params:
      per_page: "1"
    extract:
      role_uid: "$.data.business_roles[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: put_business_roles
    method: PUT
    path: "/v3/access_control/business_roles/{{role_uid}}"
    body:
      name: Senior Manager
      description: Senior management role with elevated permissions for business operations and team oversight
      permissions:
        "0":
          key: campaigns.manage
          allow: true
        "1":
          key: payments.manage
          allow: true
    expect:
      status: 403
```