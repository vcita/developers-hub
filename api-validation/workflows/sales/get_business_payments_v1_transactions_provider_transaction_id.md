---
endpoint: "GET /business/payments/v1/transactions/{provider_transaction_id}"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-26T22:04:20.020Z
verifiedAt: 2026-01-26T22:04:20.020Z
---

# Get Transactions

## Summary
Test passes. Successfully retrieved transaction details using provider_transaction_id from a newly created transaction.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_transactions
    method: GET
    path: "/business/payments/v1/transactions/{provider_transaction_id}"
    expect:
      status: [200, 201]
```
