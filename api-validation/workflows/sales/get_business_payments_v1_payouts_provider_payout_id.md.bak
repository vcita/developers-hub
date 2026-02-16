---
endpoint: GET /business/payments/v1/payouts/{provider_payout_id}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:03:21.950Z
verifiedAt: 2026-01-26T22:03:21.950Z
timesReused: 0
---
# Get Payouts

## Summary
Test passes after resolving provider_payout_id. Created a new payout and successfully retrieved it using GET /business/payments/v1/payouts/{provider_payout_id}.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| provider_payout_id | - | data.payout.provider_payout_id | - | No DELETE endpoint available for payouts |

### Resolution Steps

**provider_payout_id**:
1. **Create fresh test entity**: `POST /business/payments/v1/payouts`
   - Body template: `{"payout":{"amount":"100.00","currency":"USD","description":"Test payout","provider_payout_id":"test_payout_{{timestamp}}"}}`
2. Extract UID from creation response: `data.payout.provider_payout_id`
3. Run the test with this fresh UID
4. **Cleanup**: `No DELETE endpoint available for payouts`

```json
{
  "provider_payout_id": {
    "source_endpoint": null,
    "extract_from": "data.payout.provider_payout_id",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": "POST /business/payments/v1/payouts",
    "create_body": {
      "payout": {
        "amount": "100.00",
        "currency": "USD",
        "description": "Test payout",
        "provider_payout_id": "test_payout_{{timestamp}}"
      }
    },
    "cleanup_endpoint": "No DELETE endpoint available for payouts",
    "cleanup_note": "Payouts cannot be deleted via API - they represent financial transactions"
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
  "path": "/business/payments/v1/payouts/test_payout_123456"
}
```