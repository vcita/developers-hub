---
endpoint: PUT /business/payments/v1/scheduled_payments_rules/{uid}/cancel
domain: sales
tags: []
status: success
savedAt: 2026-01-27T05:22:31.228Z
verifiedAt: 2026-01-27T05:22:31.228Z
timesReused: 0
---
# Update Cancel

## Summary
Test passes successfully. Scheduled payments rule was successfully canceled with status changing from 'active' to 'cancelled'.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /business/payments/v1/scheduled_payments_rules | data.scheduled_payments_rules[0].uid | - | Rule remains canceled - this is the intended state after cancellation |

### Resolution Steps

**uid**:
1. Call `GET /business/payments/v1/scheduled_payments_rules`
2. Extract from response: `data.scheduled_payments_rules[0].uid`

```json
{
  "uid": {
    "source_endpoint": "GET /business/payments/v1/scheduled_payments_rules",
    "extract_from": "data.scheduled_payments_rules[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Rule remains canceled - this is the intended state after cancellation"
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
  "path": "/business/payments/v1/scheduled_payments_rules/{{resolved.uid}}/cancel",
  "body": {}
}
```