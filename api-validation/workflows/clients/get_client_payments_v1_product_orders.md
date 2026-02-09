---
endpoint: "GET /client/payments/v1/product_orders"
domain: clients
tags: []
swagger: swagger/clients/legacy/clients_payments.json
status: success
savedAt: 2026-01-25T23:16:29.094Z
verifiedAt: 2026-01-25T23:16:29.094Z
---

# Get Product orders

## Summary
Test passes successfully with client token. The endpoint requires client authentication as documented and returns product orders data correctly.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_product_orders
    method: GET
    path: "/client/payments/v1/product_orders"
    expect:
      status: [200, 201]
```
