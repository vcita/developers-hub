---
endpoint: "PUT /v3/access_control/staff_permission_overrides_lists/{staff_uid}"
domain: platform_administration
tags: [access_control, permissions]
swagger: "swagger/platform_administration/access_control.json"
status: verified
savedAt: "2026-01-29T21:00:00.000Z"
verifiedAt: "2026-01-29T21:00:00.000Z"
timesReused: 0
---

# Update Staff permission overrides lists

## Summary
Update permission overrides for a staff member. This workflow creates a new staff, retrieves their assigned business role, extracts the permissions from that role, and then sets permission overrides for the staff member.

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
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: put_staff_permission_overrides_lists
    method: PUT
    path: "/v3/access_control/staff_permission_overrides_lists/{{staff_uid}}"
    body:
      permissions:
        "0":
          key: payments.invoices.export
          state: allow
        "1":
          key: payments.invoices.view
          state: deny
    expect:
      status: [200, 201]
```
