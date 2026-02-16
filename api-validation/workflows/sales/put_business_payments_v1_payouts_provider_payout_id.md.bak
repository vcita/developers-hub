---
endpoint: PUT /business/payments/v1/payouts/{provider_payout_id}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:29:09.915Z
verifiedAt: 2026-01-26T22:29:09.915Z
timesReused: 0
---
# Update Payouts

## Summary
Test passes after resolving provider_payout_id and correcting field types. Several fields documented as strings actually require numeric values.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| provider_payout_id | Available from pre-configured parameters | payout_provider_payout_id parameter | - | - |

### Resolution Steps

**provider_payout_id**:
1. Call `Available from pre-configured parameters`
2. Extract from response: `payout_provider_payout_id parameter`

```json
{
  "provider_payout_id": {
    "source_endpoint": "Available from pre-configured parameters",
    "extract_from": "payout_provider_payout_id parameter",
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
  "path": "/business/payments/v1/payouts/test_payout_123456",
  "body": {
    "payout": {
      "account_number": "test_string",
      "currency": "USD",
      "fee": 5.99,
      "net": 94.01,
      "other": 0,
      "processed_time": "2024-01-01T00:00:00Z",
      "provider_created_time": "2024-01-01T00:00:00Z",
      "provider_updated_time": "2024-01-01T00:00:00Z",
      "status": "completed",
      "total_amount": 100
    }
  }
}
```