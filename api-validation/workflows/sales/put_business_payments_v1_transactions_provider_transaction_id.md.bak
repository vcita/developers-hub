---
endpoint: PUT /business/payments/v1/transactions/{provider_transaction_id}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:40:11.889Z
verifiedAt: 2026-01-26T22:40:11.889Z
timesReused: 0
---
# Update Transactions

## Summary
Test passes after using existing provider_transaction_id and correcting data types for monetary and date fields.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| provider_transaction_id | Available in config as transaction_provider_transaction_id | config parameter | - | - |

### Resolution Steps

**provider_transaction_id**:
1. Call `Available in config as transaction_provider_transaction_id`
2. Extract from response: `config parameter`

```json
{
  "provider_transaction_id": {
    "source_endpoint": "Available in config as transaction_provider_transaction_id",
    "extract_from": "config parameter",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
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
  "method": "PUT",
  "path": "/business/payments/v1/transactions/txn_test_1734709752_new",
  "body": {
    "transaction": {
      "card_bin": "411111",
      "card_brand": "Visa",
      "card_issuing_bank": "Test Bank",
      "card_last4": "1111",
      "cardholder_name": "John Doe",
      "create_time": "2024-01-01T00:00:00Z",
      "currency": "USD",
      "error_data": "",
      "fee": "2.50",
      "net": "97.50",
      "payment_method": "Credit Card",
      "settle_time": "2024-01-01T00:00:00Z",
      "status": "completed",
      "total_amount": "100.00",
      "transaction_type": "payment"
    }
  }
}
```