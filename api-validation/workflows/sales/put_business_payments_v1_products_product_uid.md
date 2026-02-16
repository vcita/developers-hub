---
endpoint: "PUT /business/payments/v1/products/{product_uid}"
domain: sales
tags: [products]
swagger: mcp_swagger/sales.json
status: success
savedAt: 2026-02-06T20:49:00.000Z
verifiedAt: 2026-02-06T20:49:00.000Z
timesReused: 0
useFallbackApi: true
---
# Update Product

## Summary

Updates a product by its UID. The endpoint works via the fallback API with a staff token. APIGW returns 401 because it requires OAuth Bearer token with scope business/payments which is not available in test environment.

**Token Type**: This endpoint requires a **Staff token** (via fallback API).

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway requires OAuth token not available in test env.

## Prerequisites

```yaml
steps:
  - id: get_products
    description: "Fetch products to get a valid product UID"
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
    description: "Update a product"
    method: PUT
    path: "/business/payments/v1/products/{{product_uid}}"
    body:
      product:
        name: "Updated Product Name"
    expect:
      status: [200]
```
