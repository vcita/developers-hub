---
endpoint: "POST /business/payments/v1/products"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T21:30:28.948Z"
verifiedAt: "2026-01-26T21:30:28.948Z"
timesReused: 0
---

# Create Products

## Summary
Test passes after resolving validation issues. Replaced test values with valid tax_ids, supported currency, and unique SKU.

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
        cost: 1
        currency: USD
        description: test_string
        display: true
        image_url: test_string
        name: test_string
        price: 1
        sku: test_sku_1704067200000
        tax_ids:
          "0": "{{uid}}"
    expect:
      status: [200, 201]
```
