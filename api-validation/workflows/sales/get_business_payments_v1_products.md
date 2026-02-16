---
endpoint: "GET /business/payments/v1/products"
domain: sales
tags: [products]
swagger: mcp_swagger/sales.json
status: success
savedAt: 2026-02-06T20:49:00.000Z
verifiedAt: 2026-02-06T20:49:00.000Z
timesReused: 0
useFallbackApi: true
---
# List Products

## Summary

Lists all products for the business. The endpoint works via the fallback API with a staff token. APIGW returns 401.

**Token Type**: This endpoint requires a **Staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 401 for staff tokens.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "List all products for the business"
    method: GET
    path: "/business/payments/v1/products"
    expect:
      status: [200]
```
