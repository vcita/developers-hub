---
endpoint: POST /business/payments/v1/scheduled_payments_rules
domain: sales
tags: []
status: success
savedAt: 2026-01-27T05:21:38.035Z
verifiedAt: 2026-01-27T05:21:38.035Z
timesReused: 0
---
# Create Scheduled payments rules

## Summary
Test passes after resolving UID dependencies and correcting field values. Fixed currency from 'test_string' to 'USD' and frequency_type from 'OneTime' to 'one_time'.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| matter_uid | GET /business/clients/v1/contacts/{client_uid}/matters | data.matters[0].uid | - | - |
| payment_method.uid | GET /platform/v1/clients/{client_id}/payment/cards | data.cards[0].id | - | - |

### Resolution Steps

**matter_uid**:
1. Call `GET /business/clients/v1/contacts/{client_uid}/matters`
2. Extract from response: `data.matters[0].uid`

**payment_method.uid**:
1. Call `GET /platform/v1/clients/{client_id}/payment/cards`
2. Extract from response: `data.cards[0].id`

```json
{
  "matter_uid": {
    "source_endpoint": "GET /business/clients/v1/contacts/{client_uid}/matters",
    "extract_from": "data.matters[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
  },
  "payment_method.uid": {
    "source_endpoint": "GET /platform/v1/clients/{client_id}/payment/cards",
    "extract_from": "data.cards[0].id",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
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
      "amount": 1,
      "currency": "USD",
      "cycles": 1,
      "description": "test_string",
      "frequency_type": "one_time",
      "matter_uid": "{{config.params.matter_uid}}",
      "name": "test_string",
      "payment_method": {
        "type": "card",
        "uid": "{{resolved.uid}}"
      },
      "send_receipt": true,
      "start_date": "2026-01-27T05:20:36.453Z"
    }
  }
}
```