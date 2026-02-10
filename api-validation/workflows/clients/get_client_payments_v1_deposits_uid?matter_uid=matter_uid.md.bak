---
endpoint: GET /client/payments/v1/deposits/{uid}?matter_uid={matter_uid}
domain: clients
tags: []
status: success
savedAt: 2026-01-26T05:30:19.344Z
verifiedAt: 2026-01-26T05:30:19.344Z
timesReused: 0
---
# Get Deposits

## Summary
Successfully retrieved deposit details. The original failure was due to using a deposit UID that doesn't belong to the authenticated client. Test passes when using a valid deposit UID from the client's deposits list.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /client/payments/v1/deposits | data.deposits[0].uid | - | Deposits are tied to invoices and payment requests, cleanup not needed for read-only test |
| matter_uid | GET /client/payments/v1/deposits | data.deposits[0].matter_uid | - | Matter UIDs are extracted from existing deposits, no cleanup needed |

### Resolution Steps

**uid**:
1. Call `GET /client/payments/v1/deposits`
2. Extract from response: `data.deposits[0].uid`

**matter_uid**:
1. Call `GET /client/payments/v1/deposits`
2. Extract from response: `data.deposits[0].matter_uid`

```json
{
  "uid": {
    "source_endpoint": "GET /client/payments/v1/deposits",
    "extract_from": "data.deposits[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Deposits are tied to invoices and payment requests, cleanup not needed for read-only test"
  },
  "matter_uid": {
    "source_endpoint": "GET /client/payments/v1/deposits",
    "extract_from": "data.deposits[0].matter_uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Matter UIDs are extracted from existing deposits, no cleanup needed"
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
  "path": "/client/payments/v1/deposits/cnbtlapuhzz3nm87?matter_uid=srwoxbmlnlrpadbj"
}
```