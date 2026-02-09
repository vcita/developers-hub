---
endpoint: GET /business/payments/v1/scheduled_payments_rules/{uid}
domain: sales
tags: []
status: success
savedAt: 2026-01-27T05:22:05.868Z
verifiedAt: 2026-01-27T05:22:05.868Z
timesReused: 0
---
# Get Scheduled payments rules

## Summary
Test passes. Resolved the missing uid parameter by fetching an existing scheduled payment rule from GET /business/payments/v1/scheduled_payments_rules and using its UID.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /business/payments/v1/scheduled_payments_rules | data.scheduled_payments_rules[0].uid | - | - |

### Resolution Steps

**uid**:
1. Call `GET /business/payments/v1/scheduled_payments_rules`
2. Extract from response: `data.scheduled_payments_rules[0].uid`
3. If empty, create via `POST /business/payments/v1/scheduled_payments_rules`

```json
{
  "uid": {
    "source_endpoint": "GET /business/payments/v1/scheduled_payments_rules",
    "extract_from": "data.scheduled_payments_rules[0].uid",
    "fallback_endpoint": "POST /business/payments/v1/scheduled_payments_rules",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": {
      "name": "Test Rule {{timestamp}}",
      "description": "Test scheduled payment rule",
      "amount": "10.00",
      "currency": "USD",
      "start_date": "2026-01-27T05:23:00Z",
      "frequency_type": "one_time",
      "cycles": 1,
      "payment_method": {
        "type": "card",
        "uid": "{{payment_method_uid}}"
      },
      "staff_uid": "{{staff_uid}}",
      "matter_uid": "{{matter_uid}}"
    },
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
  "path": "/business/payments/v1/scheduled_payments_rules/{{resolved.uid}}"
}
```