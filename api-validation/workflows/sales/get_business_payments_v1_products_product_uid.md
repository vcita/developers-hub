---
endpoint: "GET /business/payments/v1/products/{product_uid}"
domain: sales
tags: [products]
swagger: mcp_swagger/sales.json
status: success
savedAt: 2026-02-06T20:49:00.000Z
verifiedAt: 2026-02-06T20:49:00.000Z
timesReused: 0
useFallbackApi: true
---
# Get Product

## Summary

Retrieves a single product by its UID. The endpoint works via the fallback API with a staff token. APIGW returns 401.

**Token Type**: This endpoint requires a **Staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 401 for staff tokens.

## Prerequisites

```yaml
steps:
  - id: get_product_list
    description: "Fetch product list to get a valid product UID"
    method: GET
    path: "/business/payments/v1/products"
    extract:
      product_uid: "$.data.products[0].id"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get a single product by UID"
    method: GET
    path: "/business/payments/v1/products/{{product_uid}}"
    expect:
      status: [200]
```
