---
endpoint: "POST /business/payments/v1/products"
domain: sales
tags: [products]
swagger: "swagger/sales/legacy/payments.json"
status: success
savedAt: "2026-01-26T21:30:28.948Z"
verifiedAt: "2026-02-06T20:51:00.000Z"
timesReused: 0
useFallbackApi: true
---

# Create Product

## Summary

Creates a product. The endpoint works via the fallback API; APIGW returns 401 for staff tokens because it requires OAuth Bearer token with scope business/payments.

**Token Type**: This endpoint requires a **Staff token** (via fallback API).

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway requires OAuth token not available in test env.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_products
    method: POST
    path: "/business/payments/v1/products"
    body:
      product:
        name: "API Test Product"
        price: 10
        currency: "USD"
        display: true
    expect:
      status: [200, 201]
```
