---
endpoint: "PUT /business/payments/v1/payments/{payment_uid}"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T22:28:33.765Z"
verifiedAt: "2026-01-26T22:28:33.765Z"
timesReused: 0
---

# Update Payments

## Summary
Test passes. The payment update endpoint works correctly with valid fields appropriate for the payment's current state. The original validation errors revealed important business rules about when certain fields can be updated.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_payments
    method: PUT
    path: "/business/payments/v1/payments/{{payment_uid}}"
    body:
      payment:
        reference: Updated reference
        tips: "10.0"
    expect:
      status: [200, 201]
```
