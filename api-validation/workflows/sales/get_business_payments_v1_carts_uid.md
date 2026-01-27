---
endpoint: GET /business/payments/v1/carts/{uid}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:10:26.635Z
verifiedAt: 2026-01-26T22:10:26.635Z
timesReused: 0
---
# Get Carts

## Summary
Test passes with valid cart_uid. The original request used a generic UID instead of the specific cart_uid parameter.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| cart_uid | Available from config parameters | config.params.cart_uid | - | Used existing cart_uid from available parameters - no cleanup needed |

### Resolution Steps

**cart_uid**:
1. Call `Available from config parameters`
2. Extract from response: `config.params.cart_uid`

```json
{
  "cart_uid": {
    "source_endpoint": "Available from config parameters",
    "extract_from": "config.params.cart_uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Used existing cart_uid from available parameters - no cleanup needed"
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
  "path": "/business/payments/v1/carts/{{resolved.uid}}"
}
```