---
endpoint: "PUT /business/payments/v1/carts/{uid}/cancel"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T22:18:20.623Z"
verifiedAt: "2026-01-26T22:18:20.623Z"
timesReused: 0
---

# Update Cancel

## Summary
Test passes. Used correct cart_uid (36l0jhfysq7nnymo) from available parameters instead of generic uid parameter. Cart was successfully cancelled.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_cancel
    method: PUT
    path: "/business/payments/v1/carts/{{uid}}/cancel"
    body:
      cancel_payment_statuses_items: true
    expect:
      status: [200, 201]
```
