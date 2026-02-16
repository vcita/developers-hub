---
endpoint: "PUT /v3/access_control/business_roles/{uid}"
domain: platform_administration
tags: [access_control, business_roles]
swagger: "swagger/platform_administration/platform_administration.json"
status: verified
savedAt: 2026-02-10T16:38:15.000Z
verifiedAt: 2026-02-10T16:38:15.000Z
timesReused: 0
---

# Update Business Role

## Summary
Updates an existing business role by UID. **Token Type**: Requires a **staff token**.

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
  - id: main_request
    method: PUT
    path: "/v3/access_control/business_roles/{{role_uid}}"
    body:
      name: "Updated Senior Manager"
      description: "Updated senior management role with elevated permissions for business operations and team oversight"
      permissions:
        - key: "campaigns.manage"
          allow: true
        - key: "payments.manage"  
          allow: true
    expect:
      status: 200
```