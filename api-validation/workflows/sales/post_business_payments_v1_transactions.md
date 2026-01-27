---
endpoint: POST /business/payments/v1/transactions
domain: sales
tags: []
status: success
savedAt: 2026-01-26T21:36:19.988Z
verifiedAt: 2026-01-26T21:36:19.988Z
timesReused: 0
---
# Create Transactions

## Summary
Test passes after fixing data type issues. The metadata field must be a JSON object (not a string), and amount fields (total_amount, net, fee) must be numeric strings that can be parsed as floats.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| provider_transaction_id | - | Generated unique ID using timestamp pattern | ✓ Yes | Transaction UIDs are auto-generated and don't need cleanup |

### Resolution Steps

**provider_transaction_id**:
1. **Create fresh test entity**: `undefined`
   - Body template: `{"transaction":{"provider_transaction_id":"txn_test_{{timestamp}}"}}`
2. Extract UID from creation response: `Generated unique ID using timestamp pattern`
3. Run the test with this fresh UID
4. **Cleanup note**: Transaction UIDs are auto-generated and don't need cleanup

```json
{
  "provider_transaction_id": {
    "source_endpoint": null,
    "extract_from": "Generated unique ID using timestamp pattern",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": null,
    "create_body": {
      "transaction": {
        "provider_transaction_id": "txn_test_{{timestamp}}"
      }
    },
    "cleanup_endpoint": null,
    "cleanup_note": "Transaction UIDs are auto-generated and don't need cleanup"
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "POST",
  "path": "/business/payments/v1/transactions",
  "body": {
    "transaction": {
      "card_bin": "123456",
      "card_brand": "visa",
      "card_issuing_bank": "Chase",
      "card_last4": "1234",
      "cardholder_name": "John Doe",
      "create_time": "2024-01-15T10:30:00Z",
      "currency": "USD",
      "error_data": null,
      "fee": "2.50",
      "metadata": {
        "transaction_id": "internal_12345",
        "source": "api_test"
      },
      "net": "97.50",
      "payment_method": "Credit Card",
      "provider": "stripe",
      "provider_transaction_id": "txn_test_1734709752",
      "settle_time": "2024-01-15T10:35:00Z",
      "status": "completed",
      "total_amount": "100.00",
      "transaction_type": "payment"
    }
  }
}
```