---
endpoint: PUT /business/payments/v1/deposits/{uid}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:21:47.859Z
verifiedAt: 2026-01-26T22:21:47.859Z
timesReused: 0
---
# Update Deposits

## Summary
Test passes after using existing deposit UID and correct amount object structure. Original request failed due to invalid amount format (empty object) and non-existent deposit UID.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| deposit_uid | GET /business/payments/v1/deposits | data.deposits[0].uid | - | DELETE /business/payments/v1/deposits/{uid} |

### Resolution Steps

**deposit_uid**:
1. Call `GET /business/payments/v1/deposits`
2. Extract from response: `data.deposits[0].uid`
3. If empty, create via `POST /business/payments/v1/deposits`

```json
{
  "deposit_uid": {
    "source_endpoint": "GET /business/payments/v1/deposits",
    "extract_from": "data.deposits[0].uid",
    "fallback_endpoint": "POST /business/payments/v1/deposits",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": "DELETE /business/payments/v1/deposits/{uid}",
    "cleanup_note": "Optional - deposits can be left for future testing"
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
  "path": "/business/payments/v1/deposits/{{resolved.uid}}",
  "body": {
    "deposit": {
      "amount": {
        "type": "fixed",
        "value": "150.0",
        "total": "150.0"
      },
      "can_client_pay": true,
      "currency": "USD",
      "entity_type": "Invoice"
    }
  }
}
```