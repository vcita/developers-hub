---
endpoint: "POST /v3/access_control/business_roles"
domain: platform_administration
tags: []
swagger: /Users/ram.almog/Documents/GitHub/developers-hub/mcp_swagger/platform_administration.json
status: success
savedAt: 2026-02-10T21:20:30.806Z
verifiedAt: 2026-02-10T21:20:30.806Z
timesReused: 0
---
# Create Business roles

## Summary

Endpoint POST /v3/access_control/business_roles successfully returns 2xx (HTTP 201) and creates a BusinessRole as expected. The original test failure appears to be a misunderstanding - HTTP 201 is a success status code.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Create business_roles"
    method: POST
    path: "/v3/access_control/business_roles"
    body:
      code: "test_role_1707552018804"
      name: "Custom Business Role"
      description: "Role for custom business operations"
      permissions: [{"key":"payments.manage","allow":true}]
    expect:
      status: [200, 201]
```