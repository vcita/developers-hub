---
endpoint: PUT /business/payments/v1/scheduled_payments_rules/{uid}
domain: sales
tags: []
status: success
savedAt: 2026-01-27T05:23:47.773Z
verifiedAt: 2026-01-27T05:23:47.773Z
timesReused: 0
---
# Update Scheduled payments rules

## Summary
Test passes after resolving UID and providing correct request body format. The endpoint requires request body to be wrapped in 'scheduled_payments_rule' field.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | POST /business/payments/rules | data.scheduled_payments_rule.uid | ✓ POST /business/payments/v1/scheduled_payments_rules | PUT /business/payments/v1/scheduled_payments_rules/{uid}/cancel |

### Resolution Steps

**uid**:
1. **Create fresh test entity**: `POST /business/payments/v1/scheduled_payments_rules`
   - Body template: `{"scheduled_payments_rule":{"staff_uid":"{{staff_uid}}","matter_uid":"{{matter_uid}}","name":"Test Recurring Payment {{timestamp}}","description":"Test recurring payment for update","amount":"50.00","currency":"USD","start_date":"2026-02-01","frequency_type":"monthly","cycles":12,"payment_method":{"type":"card","uid":"{{payment_method_uid}}"},"send_receipt":true}}`
2. Extract UID from creation response: `data.scheduled_payments_rule.uid`
3. Run the test with this fresh UID
4. **Cleanup**: `PUT /business/payments/v1/scheduled_payments_rules/{uid}/cancel`

```json
{
  "uid": {
    "source_endpoint": "POST /business/payments/rules",
    "extract_from": "data.scheduled_payments_rule.uid",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": "POST /business/payments/v1/scheduled_payments_rules",
    "create_body": {
      "scheduled_payments_rule": {
        "staff_uid": "{{staff_uid}}",
        "matter_uid": "{{matter_uid}}",
        "name": "Test Recurring Payment {{timestamp}}",
        "description": "Test recurring payment for update",
        "amount": "50.00",
        "currency": "USD",
        "start_date": "2026-02-01",
        "frequency_type": "monthly",
        "cycles": 12,
        "payment_method": {
          "type": "card",
          "uid": "{{payment_method_uid}}"
        },
        "send_receipt": true
      }
    },
    "cleanup_endpoint": "PUT /business/payments/v1/scheduled_payments_rules/{uid}/cancel",
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
  "method": "PUT",
  "path": "/business/payments/v1/scheduled_payments_rules/{{resolved.uid}}",
  "body": {
    "scheduled_payments_rule": {}
  }
}
```