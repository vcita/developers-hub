---
endpoint: "POST /v3/access_control/business_roles"
domain: platform_administration
tags: []
swagger: /Users/ram.almog/Documents/GitHub/developers-hub/mcp_swagger/platform_administration.json
status: success
savedAt: 2026-02-10T05:31:49.011Z
verifiedAt: 2026-02-10T05:31:49.011Z
timesReused: 0
---
# Create Business roles

## Summary

The endpoint POST /v3/access_control/business_roles is working correctly and returns HTTP 201 (Created) with a successful response. Both the original test and my retry returned 2xx status codes with properly formatted business role data.

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
      code: "test_role_1706455200001"
      name: "Custom Role"
      description: "A unique role for business operations"
      permissions: [{"key":"payments.manage","allow":true}]
    expect:
      status: [200, 201]
```