---
endpoint: "PUT /v3/access_control/business_roles/{uid}"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/access_control.json"
status: verified
savedAt: "2026-01-28T11:48:22.190Z"
verifiedAt: "2026-01-28T11:48:22.190Z"
timesReused: 0
---

# Update Business roles

## Summary
Test passes after resolving UID and using valid permission keys. Original test used non-existent permission keys ('read_reports', 'manage_team') which caused validation errors.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_business_roles
    method: PUT
    path: "/v3/access_control/business_roles/{{uid}}"
    body:
      name: Senior Manager
      description: Senior management role with elevated permissions for business
        operations and team oversight
      permissions:
        "0":
          key: campaigns.manage
          allow: true
        "1":
          key: payments.manage
          allow: true
    expect:
      status: [200, 201]
```
