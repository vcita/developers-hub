---
endpoint: "PUT /business/payments/v1/products/{product_id}"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: success
savedAt: "2026-01-26T22:30:27.011Z"
verifiedAt: "2026-02-06T21:00:00.000Z"
timesReused: 0
useFallbackApi: true
---

# Update Products

## Summary
Test passes. The original failure was due to using a non-unique SKU value. After updating the SKU to "unique-sku-1734709873" and using a valid tax_id, the product update succeeded with HTTP 200.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_products
    method: PUT
    path: "/business/payments/v1/products/{{product_id}}"
    body:
      product:
        cost: 1
        description: Updated test description
        display: true
        image_url: https://example.com/updated-image.jpg
        name: Updated test product
        price: 15.99
        sku: unique-sku-1734709873
        tax_ids:
          "0": "{{uid}}"
    expect:
      status: [200, 201]
```
