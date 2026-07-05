---
endpoint: "PUT /business/payments/v1/product_orders/{product_order_uid}"
domain: sales
tags: [product_orders]
swagger: mcp_swagger/sales.json
status: success
savedAt: 2026-02-06T20:49:00.000Z
verifiedAt: 2026-02-06T20:49:00.000Z
timesReused: 0
useFallbackApi: true
requiresTestData: true
testDataDescription: "Business must have at least one product and one product order"
---
# Update Product Order

## Summary

Updates a product order by its UID. Requires a prerequisite step to create a product order first since there is no list endpoint. The endpoint works via the fallback API with a staff token.

**Token Type**: This endpoint requires a **Staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 401 for staff tokens.

## Prerequisites

```yaml
steps:
  - id: get_products
    description: "Fetch products to get a product ID"
    method: GET
    path: "/business/payments/v1/products"
    extract:
      product_id: "$.data.products[0].id"
    expect:
      status: 200
    onFail: abort

  - id: create_product_order
    description: "Create a product order to get a valid UID"
    method: POST
    path: "/business/payments/v1/product_orders"
    body:
      product_order:
        product_id: "{{product_id}}"
        client_id: "{{client_id}}"
        matter_uid: "{{matter_uid}}"
        quantity: 1
    extract:
      product_order_uid: "$.data.product_order.id"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    description: "Update the product order"
    method: PUT
    path: "/business/payments/v1/product_orders/{{product_order_uid}}"
    body:
      product_order:
        description: "Updated via API test"
    expect:
      status: [200]
```
