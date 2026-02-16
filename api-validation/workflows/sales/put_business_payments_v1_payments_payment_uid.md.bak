---
endpoint: PUT /business/payments/v1/payments/{payment_uid}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:28:33.765Z
verifiedAt: 2026-01-26T22:28:33.765Z
timesReused: 0
---
# Update Payments

## Summary
Test passes. The payment update endpoint works correctly with valid fields appropriate for the payment's current state. The original validation errors revealed important business rules about when certain fields can be updated.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| payment_uid | Already resolved from config | config.params.payment_uid | - | No cleanup needed - using existing payment |

### Resolution Steps

**payment_uid**:
1. Call `Already resolved from config`
2. Extract from response: `config.params.payment_uid`

```json
{
  "payment_uid": {
    "source_endpoint": "Already resolved from config",
    "extract_from": "config.params.payment_uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - using existing payment"
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
  "path": "/business/payments/v1/payments/{{resolved.uid}}",
  "body": {
    "payment": {
      "reference": "Updated reference",
      "tips": "10.0"
    }
  }
}
```