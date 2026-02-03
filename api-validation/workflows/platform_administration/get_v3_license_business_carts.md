---
endpoint: "GET /v3/license/business_carts"
domain: platform_administration
tags: [license]
swagger: swagger/platform_administration/license.json
status: skip
savedAt: 2026-01-28T12:00:28.693Z
verifiedAt: 2026-01-28T12:00:28.693Z
---

# Get Business carts

## Summary
User-approved skip: The endpoint is not implemented in the backend. The swagger documentation mentions 'coming soon' but the endpoint returns 404 'Cannot GET' because there's no @Get() route handler in the CartsController.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_business_carts
    method: GET
    path: "/v3/license/business_carts"
    expect:
      status: [200, 201]
```
