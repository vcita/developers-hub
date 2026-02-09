---
endpoint: "POST /v3/access_control/business_roles"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/access_control.json"
status: verified
savedAt: "2026-01-28T10:51:45.143Z"
verifiedAt: "2026-01-28T10:51:45.143Z"
timesReused: 0
---

# Create Business roles

## Summary
Successfully created BusinessRole after resolving permission validation issues. The endpoint requires valid permission keys from GET /v3/access_control/permissions, and has hierarchical permission validation rules.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_business_roles
    method: POST
    path: "/v3/access_control/business_roles"
    body:
      code: test_role_{timestamp}
      name: Test Role {timestamp}
      description: Test role created for API validation with timestamp-based unique identifier
      is_editable: true
      permissions:
        "0":
          key: campaigns.manage
          allow: true
        "1":
          key: payments.manage
          allow: true
        "2":
          key: payments.client_payments.manage
          allow: true
    expect:
      status: [200, 201]
```
