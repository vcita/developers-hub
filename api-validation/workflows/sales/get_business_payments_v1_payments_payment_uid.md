---
endpoint: "GET /business/payments/v1/payments/{payment_uid}"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T06:34:44.972Z"
verifiedAt: "2026-01-26T06:34:44.972Z"
timesReused: 0
---

# Get Payments

## Summary
Test passes successfully. GET /business/payments/v1/payments/{payment_uid} returns detailed payment information with HTTP 200 status.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_payments
    method: GET
    path: "/business/payments/v1/payments/{{payment_uid}}"
    expect:
      status: [200, 201]
```
