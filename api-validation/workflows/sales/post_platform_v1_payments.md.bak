---
endpoint: POST /platform/v1/payments
domain: sales
tags: []
status: success
savedAt: 2026-01-26T21:58:21.948Z
verifiedAt: 2026-01-26T21:58:21.948Z
timesReused: 0
---
# Create Payments

## Summary
Test passes after using correct client_uid instead of client_id. The API expects client_id field to contain the client UID, not the client ID hash.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| client_id | GET /platform/v1/clients | data.clients[].id (use client_uid from config, not client_id) | - | No cleanup needed - payment records are retained |

### Resolution Steps

**client_id**:
1. Call `GET /platform/v1/clients`
2. Extract from response: `data.clients[].id (use client_uid from config, not client_id)`

```json
{
  "client_id": {
    "source_endpoint": "GET /platform/v1/clients",
    "extract_from": "data.clients[].id (use client_uid from config, not client_id)",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - payment records are retained"
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
  "method": "POST",
  "path": "/platform/v1/payments",
  "body": {
    "amount": 100,
    "client_id": "{{config.params.client_id}}",
    "currency": "USD",
    "payment_method": "Cash",
    "title": "Test Payment",
    "send_receipt": false
  }
}
```