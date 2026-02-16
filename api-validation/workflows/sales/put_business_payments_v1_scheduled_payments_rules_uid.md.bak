---
endpoint: PUT /business/payments/v1/scheduled_payments_rules/{uid}
domain: sales
tags: []
status: success
savedAt: 2026-01-27T05:47:09.538Z
verifiedAt: 2026-01-27T05:47:09.538Z
timesReused: 0
---
# Update Scheduled payments rules

## Summary
Test passes after using an active scheduled payment rule. The original UID referred to a cancelled rule, but UPDATE operations require the rule to have status='active'.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| scheduled_payments_rule_uid | GET /business/payments/v1/scheduled_payments_rules | data.scheduled_payments_rules.find(rule => rule.status === 'active').uid | - | Can be cancelled via PUT /business/payments/v1/scheduled_payments_rules/{uid}/cancel |

### Resolution Steps

**scheduled_payments_rule_uid**:
1. Call `GET /business/payments/v1/scheduled_payments_rules`
2. Extract from response: `data.scheduled_payments_rules.find(rule => rule.status === 'active').uid`
3. If empty, create via `POST /business/payments/v1/scheduled_payments_rules`

```json
{
  "scheduled_payments_rule_uid": {
    "source_endpoint": "GET /business/payments/v1/scheduled_payments_rules",
    "extract_from": "data.scheduled_payments_rules.find(rule => rule.status === 'active').uid",
    "fallback_endpoint": "POST /business/payments/v1/scheduled_payments_rules",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": {
      "scheduled_payments_rule": {
        "name": "Test Active Payment Rule {{timestamp}}",
        "description": "Test payment rule for update operations",
        "amount": "100.0",
        "start_date": "2026-02-01",
        "frequency_type": "monthly",
        "cycles": 12,
        "matter_uid": "{{matter_uid}}",
        "payment_method": {
          "type": "card",
          "uid": "{{payment_method_uid}}"
        }
      }
    },
    "cleanup_endpoint": null,
    "cleanup_note": "Can be cancelled via PUT /business/payments/v1/scheduled_payments_rules/{uid}/cancel"
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
  "path": "/business/payments/v1/scheduled_payments_rules/{{resolved.uid}}",
  "body": {
    "scheduled_payments_rule": {
      "payment_method": {
        "type": "card",
        "uid": "{{resolved.uid}}"
      }
    }
  }
}
```