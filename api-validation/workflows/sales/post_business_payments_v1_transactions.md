---
endpoint: "POST /business/payments/v1/transactions"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T21:36:19.988Z"
verifiedAt: "2026-01-26T21:36:19.988Z"
timesReused: 0
---

# Create Transactions

## Summary
Test passes after fixing data type issues. The metadata field must be a JSON object (not a string), and amount fields (total_amount, net, fee) must be numeric strings that can be parsed as floats.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_transactions
    method: POST
    path: "/business/payments/v1/transactions"
    body:
      transaction:
        card_bin: "123456"
        card_brand: visa
        card_issuing_bank: Chase
        card_last4: "1234"
        cardholder_name: John Doe
        create_time: 2024-01-15T10:30:00Z
        currency: USD
        error_data: null
        fee: "2.50"
        metadata:
          transaction_id: internal_12345
          source: api_test
        net: "97.50"
        payment_method: Credit Card
        provider: stripe
        provider_transaction_id: txn_test_1734709752
        settle_time: 2024-01-15T10:35:00Z
        status: completed
        total_amount: "100.00"
        transaction_type: payment
    expect:
      status: [200, 201]
```
