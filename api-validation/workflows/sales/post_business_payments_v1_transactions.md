---
endpoint: POST /business/payments/v1/transactions
domain: sales
tags: []
status: pass
savedAt: 2026-01-23T22:16:01.097Z
verifiedAt: 2026-01-23T22:16:01.097Z
timesReused: 0
---
# Create Transactions

## Summary
Test passes - Transaction was successfully created with 201 status. The issue was that the metadata field must be sent as a JSON object, not as a JSON string.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/business/payments/v1/transactions",
  "body": {
    "transaction": {
      "provider_transaction_id": "txn_12345_test",
      "payment_method": "Credit Card",
      "provider": "Stripe",
      "total_amount": "100.00",
      "currency": "USD",
      "fee": "3.50",
      "net": "96.50",
      "status": "completed",
      "transaction_type": "payment",
      "create_time": "2026-01-23T22:14:49.215Z",
      "settle_time": "2026-01-23T22:14:49.215Z",
      "card_last4": "4242",
      "card_brand": "Visa",
      "card_bin": "424242",
      "card_issuing_bank": "Chase Bank",
      "cardholder_name": "John Doe",
      "related_provider_payout_id": "po_test_1737622195678_unique",
      "metadata": {
        "order_id": "12345",
        "customer": "test"
      }
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| metadata | Documentation shows metadata as type 'string' in the swagger schema, but the API validation requires it to be a Hash/Object, not a JSON string | Update swagger schema to show metadata as type 'object' instead of 'string' to match the actual validation logic | critical |