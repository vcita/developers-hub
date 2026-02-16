---
endpoint: GET /business/payments/v1/payments/{payment_uid}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T06:34:44.972Z
verifiedAt: 2026-01-26T06:34:44.972Z
timesReused: 0
---
# Get Payments

## Summary
Test passes successfully. GET /business/payments/v1/payments/{payment_uid} returns detailed payment information with HTTP 200 status.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| payment_uid | GET /business/payments/v1/payments | data.payments[0].uid | - | - |

### Resolution Steps

**payment_uid**:
1. Call `GET /business/payments/v1/payments`
2. Extract from response: `data.payments[0].uid`

```json
{
  "payment_uid": {
    "source_endpoint": "GET /business/payments/v1/payments",
    "extract_from": "data.payments[0].uid",
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
  "method": "GET",
  "path": "/business/payments/v1/payments/{{resolved.uid}}"
}
```