---
endpoint: "POST /business/payments/v1/product_orders"
domain: sales
tags: [product_orders]
swagger: "swagger/sales/legacy/payments.json"
status: success
savedAt: "2026-01-26T21:30:04.269Z"
verifiedAt: "2026-02-06T20:51:00.000Z"
timesReused: 0
---

# Create Product Order

## Summary

Creates a product order. Requires a valid product_id (from GET /business/payments/v1/products). The endpoint works via the fallback API; APIGW returns 401 for staff tokens.

**Token Type**: This endpoint requires a **Staff token**.

## Prerequisites

```yaml
steps:
  - id: get_products
    description: "Fetch products to get a valid product ID"
    method: GET
    path: "/business/payments/v1/products"
    extract:
      product_id: "$.data.products[0].id"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_product_orders
    method: POST
    path: "/business/payments/v1/product_orders"
    body:
      product_order:
        client_id: "{{client_id}}"
        matter_uid: "{{matter_uid}}"
        price: 1
        product_id: "{{product_id}}"
    expect:
      status: [200, 201]
```
