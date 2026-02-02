---
endpoint: "PUT /business/payments/v1/product_orders/{product_order_id}"
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:29:54.779Z
verifiedAt: 2026-01-26T22:29:54.779Z
---

# Update Product orders

## Summary
Test passes. The product order was successfully updated. Original error was caused by using 'test_string' as tax_id instead of a valid tax ID.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_product_orders
    method: PUT
    path: "/business/payments/v1/product_orders/{product_order_id}"
    body:
      product_order:
        price: 1
        tax_ids:
          "0": "{{uid}}"
    expect:
      status: [200, 201]
```
