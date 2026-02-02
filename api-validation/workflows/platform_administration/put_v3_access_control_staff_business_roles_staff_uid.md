---
endpoint: "PUT /v3/access_control/staff_business_roles/{staff_uid}"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/access_control.json
status: success
savedAt: 2026-01-28T11:50:24.410Z
verifiedAt: 2026-01-28T11:50:24.410Z
---

# Update Staff business roles

## Summary
Endpoint works correctly. The 403 error occurred because the test tried to update the business role of the business owner, which is not allowed by business logic. Successfully updated a non-owner staff member's business role.

## Prerequisites

```yaml
steps:
  - id: get_staffs
    description: "Fetch available staff members"
    method: GET
    path: "/platform/v1/businesses/{{business_id}}/staffs"
    params:
      per_page: "1"
    extract:
      staff_id: "$.data.staffs[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: put_staff_business_roles
    method: PUT
    path: "/v3/access_control/staff_business_roles/{staff_uid}"
    body:
      business_role_uid: "{{business_role_uid}}"
    expect:
      status: [200, 201]
```
