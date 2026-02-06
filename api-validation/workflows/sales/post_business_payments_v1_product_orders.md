---
endpoint: "POST /business/payments/v1/product_orders"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T21:30:04.269Z"
verifiedAt: "2026-01-26T21:30:04.269Z"
timesReused: 0
---

# Create Product orders

## Summary
Test passes after replacing placeholder tax_id with valid tax ID from GET /business/payments/v1/taxes. The original request used "test_string" for tax_ids which caused a 422 error, but with valid tax ID "qa5va78pi0jk6gts" the request succeeds with HTTP 201.

## Prerequisites

No prerequisites required for this endpoint.

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
        tax_ids:
          "0": "{{uid}}"
    expect:
      status: [200, 201]
```
