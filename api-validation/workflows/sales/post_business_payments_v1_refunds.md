---
endpoint: "POST /business/payments/v1/refunds"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T21:31:23.416Z"
verifiedAt: "2026-01-26T21:31:23.416Z"
timesReused: 0
---

# Create Refunds

## Summary
Test passes with valid ISO8601 datetime format for refund_time field. Original test used 'test_string' which caused validation error.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_refunds
    method: POST
    path: "/business/payments/v1/refunds"
    body:
      refund:
        amount: 1
        payment_uid: "{{payment_uid}}"
        provider_transaction_id: test_txn_123456
        record_refund: true
        refund_time: 2024-01-15T10:00:00Z
    expect:
      status: [200, 201]
```
