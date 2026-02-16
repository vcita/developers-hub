---
endpoint: GET /business/payments/v1/transactions/{provider_transaction_id}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:04:20.020Z
verifiedAt: 2026-01-26T22:04:20.020Z
timesReused: 0
---
# Get Transactions

## Summary
Test passes. Successfully retrieved transaction details using provider_transaction_id from a newly created transaction.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| provider_transaction_id | POST /business/payments/v1/transactions | data.transaction.provider_transaction_id | ✓ Yes | No DELETE endpoint available for transactions |

### Resolution Steps

**provider_transaction_id**:
1. **Create fresh test entity**: `undefined`
   - Body template: `{"transaction":{"provider_transaction_id":"txn_test_{{timestamp}}","provider":"stripe","transaction_type":"payment","status":"completed","total_amount":"200","net":"194.5","fee":"5.5","currency":"USD","create_time":"2022-06-01T08:00:00Z","settle_time":"2022-06-02T18:00:00Z","cardholder_name":"CARDHOLDER NAME","card_brand":"visa","card_last4":"2468","card_issuing_bank":"Chase Bank","card_bin":"411111","payment_method":"Credit Card"}}`
2. Extract UID from creation response: `data.transaction.provider_transaction_id`
3. Run the test with this fresh UID
4. **Cleanup note**: No DELETE endpoint available for transactions

```json
{
  "provider_transaction_id": {
    "source_endpoint": "POST /business/payments/v1/transactions",
    "extract_from": "data.transaction.provider_transaction_id",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": null,
    "create_body": {
      "transaction": {
        "provider_transaction_id": "txn_test_{{timestamp}}",
        "provider": "stripe",
        "transaction_type": "payment",
        "status": "completed",
        "total_amount": "200",
        "net": "194.5",
        "fee": "5.5",
        "currency": "USD",
        "create_time": "2022-06-01T08:00:00Z",
        "settle_time": "2022-06-02T18:00:00Z",
        "cardholder_name": "CARDHOLDER NAME",
        "card_brand": "visa",
        "card_last4": "2468",
        "card_issuing_bank": "Chase Bank",
        "card_bin": "411111",
        "payment_method": "Credit Card"
      }
    },
    "cleanup_endpoint": null,
    "cleanup_note": "No DELETE endpoint available for transactions"
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
  "method": "GET",
  "path": "/business/payments/v1/transactions/txn_test_1734709752_new"
}
```