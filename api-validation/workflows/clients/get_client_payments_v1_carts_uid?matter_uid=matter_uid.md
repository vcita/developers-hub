---
endpoint: GET /client/payments/v1/carts/{uid}?matter_uid={matter_uid}
domain: clients
tags: []
status: success
savedAt: 2026-01-25T20:59:26.947Z
verifiedAt: 2026-01-25T20:59:26.947Z
timesReused: 0
---
# Get Carts

## Summary
Test passed after resolving valid cart UID. The original cart UID from config was not valid for this client context. Used GET /client/payments/v1/carts to find a valid cart UID (4jw2suu1ckix25dq) that matches the matter_uid from config.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| cart_uid | GET /client/payments/v1/carts | data.carts[0].uid | - | No cleanup needed - using existing carts from client context |

### Resolution Steps

**cart_uid**:
1. Call `GET /client/payments/v1/carts`
2. Extract from response: `data.carts[0].uid`

```json
{
  "cart_uid": {
    "source_endpoint": "GET /client/payments/v1/carts",
    "extract_from": "data.carts[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - using existing carts from client context"
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
  "path": "/client/payments/v1/carts/4jw2suu1ckix25dq?matter_uid=dqbqxo258gmaqctk"
}
```