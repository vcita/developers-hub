---
endpoint: POST /business/payments/v1/payouts
domain: sales
tags: []
status: pass
savedAt: 2026-01-23T22:10:55.231Z
verifiedAt: 2026-01-23T22:10:55.231Z
timesReused: 0
---
# Create Payouts

## Summary
Payout creation successful with unique provider_payout_id. Original error was due to duplicate provider_payout_id - the endpoint correctly enforces uniqueness constraint.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| provider_payout_id | none | generated_unique_id | Yes |

```json
{
  "provider_payout_id": {
    "source_endpoint": "none",
    "resolved_value": "po_test_1737622195678_unique",
    "used_fallback": true,
    "fallback_endpoint": "generated_unique_id"
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/business/payments/v1/payouts",
  "body": {
    "payout": {
      "provider_payout_id": "po_test_1737622195678_unique",
      "account_number": "****1234",
      "currency": "USD",
      "fee": "2.50",
      "net": "97.50",
      "other": "0.00",
      "processed_time": "2026-01-23T20:10:21.236Z",
      "provider_created_time": "2026-01-23T19:10:21.236Z",
      "provider_updated_time": "2026-01-23T20:10:21.236Z",
      "status": "completed",
      "total_amount": "100.00"
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| provider_payout_id | Documentation should clarify that provider_payout_id must be globally unique across all payouts in the system | Add note in swagger documentation: 'Must be unique across all payouts. If a payout with this provider_payout_id already exists, a 422 error with code already_exists will be returned' | major |