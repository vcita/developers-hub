---
endpoint: "PUT /business/payments/v1/transactions/{provider_transaction_id}"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T22:40:11.889Z"
verifiedAt: "2026-01-26T22:40:11.889Z"
timesReused: 0
---

# Update Transactions

## Summary
Test passes after using existing provider_transaction_id and correcting data types for monetary and date fields.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_transactions
    method: PUT
    path: "/business/payments/v1/transactions/{{provider_transaction_id}}"
    body:
      transaction:
        card_bin: "411111"
        card_brand: Visa
        card_issuing_bank: Test Bank
        card_last4: "1111"
        cardholder_name: John Doe
        create_time: 2024-01-01T00:00:00Z
        currency: USD
        error_data: ""
        fee: "2.50"
        net: "97.50"
        payment_method: Credit Card
        settle_time: 2024-01-01T00:00:00Z
        status: completed
        total_amount: "100.00"
        transaction_type: payment
    expect:
      status: [200, 201]
```
