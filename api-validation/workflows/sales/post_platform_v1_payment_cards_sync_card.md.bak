---
endpoint: POST /platform/v1/payment/cards/sync_card
domain: sales
tags: []
status: success
savedAt: 2026-01-27T04:21:19.647Z
verifiedAt: 2026-01-27T04:21:19.647Z
timesReused: 0
---
# Create Sync card

## Summary
Test passes after fixing typo and providing proper card details structure. Original request had 'datails' (typo) and empty details object causing slice! method error on nil.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| customer_id | - | data[0].uid or data[0].id | ✓ Yes | - |
| external_card_id | - | data[0].uid or data[0].id | ✓ Yes | - |
| card_details | - | data[0].uid or data[0].id | ✓ Yes | - |

### Resolution Steps

**customer_id**:
1. **Create fresh test entity**: `undefined`
   - Body template: `"Use realistic payment gateway customer ID format like 'cus_test_customer_{{timestamp}}'"`
2. Extract UID from creation response: `data.uid`
3. Run the test with this fresh UID

**external_card_id**:
1. **Create fresh test entity**: `undefined`
   - Body template: `"Use realistic payment gateway card ID format like 'card_test_{{timestamp}}'"`
2. Extract UID from creation response: `data.uid`
3. Run the test with this fresh UID

**card_details**:
1. **Create fresh test entity**: `undefined`
   - Body template: `{"exp_month":6,"exp_year":2026,"last_4":"1234","cardholder_name":"Test User","card_brand":"visa"}`
2. Extract UID from creation response: `data.uid`
3. Run the test with this fresh UID

```json
{
  "customer_id": {
    "source_endpoint": null,
    "extract_from": "first item uid",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": null,
    "create_body": "Use realistic payment gateway customer ID format like 'cus_test_customer_{{timestamp}}'",
    "cleanup_endpoint": null,
    "cleanup_note": null
  },
  "external_card_id": {
    "source_endpoint": null,
    "extract_from": "first item uid",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": null,
    "create_body": "Use realistic payment gateway card ID format like 'card_test_{{timestamp}}'",
    "cleanup_endpoint": null,
    "cleanup_note": null
  },
  "card_details": {
    "source_endpoint": null,
    "extract_from": "first item uid",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": null,
    "create_body": {
      "exp_month": 6,
      "exp_year": 2026,
      "last_4": "1234",
      "cardholder_name": "Test User",
      "card_brand": "visa"
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
  "method": "POST",
  "path": "/platform/v1/payment/cards/sync_card",
  "body": {
    "client_id": "{{config.params.client_id}}",
    "customer_id": "cus_test_customer_456",
    "details": {
      "exp_month": 6,
      "exp_year": 2026,
      "last_4": "1234",
      "cardholder_name": "John Doe",
      "card_brand": "mastercard"
    },
    "default": true,
    "external_card_id": "card_test_789012"
  }
}
```