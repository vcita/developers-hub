---
endpoint: PUT /business/payments/v1/carts/{uid}/cart_completed
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:19:04.860Z
verifiedAt: 2026-01-26T22:19:04.860Z
timesReused: 0
---
# Update Cart completed

## Summary
Test passes with HTTP 200. Used the correct cart_uid from available parameters (36l0jhfysq7nnymo) instead of the generic uid parameter.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| cart_uid | Available from config parameters | cart_uid parameter | - | Used existing cart_uid from configured parameters rather than creating new cart |

### Resolution Steps

**cart_uid**:
1. Call `Available from config parameters`
2. Extract from response: `cart_uid parameter`

```json
{
  "cart_uid": {
    "source_endpoint": "Available from config parameters",
    "extract_from": "cart_uid parameter",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Used existing cart_uid from configured parameters rather than creating new cart"
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
  "path": "/business/payments/v1/carts/{{resolved.uid}}/cart_completed",
  "body": {}
}
```