---
endpoint: PUT /business/payments/v1/carts/{uid}/cancel
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:18:20.623Z
verifiedAt: 2026-01-26T22:18:20.623Z
timesReused: 0
---
# Update Cancel

## Summary
Test passes. Used correct cart_uid (36l0jhfysq7nnymo) from available parameters instead of generic uid parameter. Cart was successfully cancelled.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| cart_uid | GET /business/payments/v1/carts/{uid} | data.cart.uid | - | Cart is cancelled after test, no cleanup needed |

### Resolution Steps

**cart_uid**:
1. Call `GET /business/payments/v1/carts/{uid}`
2. Extract from response: `data.cart.uid`

```json
{
  "cart_uid": {
    "source_endpoint": "GET /business/payments/v1/carts/{uid}",
    "extract_from": "data.cart.uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Cart is cancelled after test, no cleanup needed"
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
  "path": "/business/payments/v1/carts/{{resolved.uid}}/cancel",
  "body": {
    "cancel_payment_statuses_items": true
  }
}
```