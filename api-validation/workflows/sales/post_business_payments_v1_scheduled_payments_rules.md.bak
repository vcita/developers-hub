---
endpoint: POST /business/payments/v1/scheduled_payments_rules
domain: sales
tags: []
status: success
savedAt: 2026-01-27T05:37:36.671Z
verifiedAt: 2026-01-27T05:37:36.671Z
timesReused: 0
---
# Create Scheduled payments rules

## Summary
Test passes after fixing currency (USD instead of test_string), frequency_type (one_time instead of OneTime), and using a valid payment method UID from the correct client.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| matter_uid | GET /business/clients/v1/contacts/3lf5pm2472o5g895/matters | data.matters[0].uid | - | - |
| payment_method_uid | GET /platform/v1/clients/{client_uid}/payment/cards | data.cards[0].id | - | - |

### Resolution Steps

**matter_uid**:
1. **Create fresh test entity**: `POST /business/clients/v1/contacts/{client_uid}/matters`
2. Extract UID from creation response: `data.matters[0].uid`
3. Run the test with this fresh UID

**payment_method_uid**:
1. **Create fresh test entity**: `POST /client/payments/v1/cards`
2. Extract UID from creation response: `data.cards[0].id`
3. Run the test with this fresh UID

```json
{
  "matter_uid": {
    "source_endpoint": "GET /business/clients/v1/contacts/3lf5pm2472o5g895/matters",
    "extract_from": "data.matters[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": "POST /business/clients/v1/contacts/{client_uid}/matters",
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
  },
  "payment_method_uid": {
    "source_endpoint": "GET /platform/v1/clients/{client_uid}/payment/cards",
    "extract_from": "data.cards[0].id",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": "POST /client/payments/v1/cards",
    "create_body": null,
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
  "method": "POST",
  "path": "/business/payments/v1/scheduled_payments_rules",
  "body": {
    "scheduled_payments_rule": {
      "amount": 100,
      "currency": "USD",
      "cycles": 1,
      "description": "Test scheduled payment rule",
      "frequency_type": "one_time",
      "matter_uid": "{{config.params.matter_uid}}",
      "name": "Test Scheduled Payment",
      "payment_method": {
        "type": "card",
        "uid": "{{resolved.uid}}"
      },
      "send_receipt": true,
      "start_date": "2026-01-28T05:35:23.992Z"
    }
  }
}
```