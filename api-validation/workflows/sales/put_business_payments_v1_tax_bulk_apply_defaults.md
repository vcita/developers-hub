---
endpoint: "PUT /business/payments/v1/tax_bulk/apply_defaults"
domain: sales
tags: [taxes]
swagger: mcp_swagger/sales.json
status: success
savedAt: 2026-02-06T20:49:00.000Z
verifiedAt: 2026-02-06T20:49:00.000Z
timesReused: 0
---
# Apply Default Taxes

## Summary

Applies default taxes to the business in the background. Takes no body parameters; uses current staff/business context. The endpoint works via the fallback API with a staff token. Requires staff with Settings/Payments access.

**Token Type**: This endpoint requires a **Staff token** with payments/settings permission.

## Prerequisites

None required for this endpoint. The endpoint takes no body; it derives business_uid from context and staff_uid from token.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Apply default taxes to the business"
    method: PUT
    path: "/business/payments/v1/tax_bulk/apply_defaults"
    body: {}
    expect:
      status: [200]
```
