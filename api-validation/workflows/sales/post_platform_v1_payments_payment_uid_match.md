---
endpoint: POST /platform/v1/payments/{payment_uid}/match
domain: sales
tags: []
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: success
savedAt: 2026-01-27T04:26:01.284Z
verifiedAt: 2026-01-27T04:26:01.284Z
timesReused: 0
---
# Create Match

## Summary
Test passes after understanding the complex validation requirements. The match payment endpoint requires exact matching criteria: payment amount ≤ payment_status amount, both in same matter, payment_status in pending state, same currency, and payment_status must be due or overdue.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| payment_status_uid | GET /business/payments/v1/payment_requests | data.payment_requests[].uid where state='pending' and matter_uid matches | ✓ POST /business/payments/v1/carts | PUT /business/payments/v1/carts/{uid}/cancel |
| payment_uid | GET /platform/v1/payments | data.payments[] where conversation_id matches matter_uid and amount <= payment_request amount | ✓ POST /platform/v1/payments | - |

### Resolution Steps

**payment_status_uid**:
1. **Create fresh test entity**: `POST /business/payments/v1/carts`
   - Body template: `{"cart":{"client_uid":"{{client_uid}}","matter_uid":"{{matter_uid}}","currency":"USD","items":[{"qty":1,"entity_type":"Service","entity_uid":"{{service_uid}}","price":"{{amount}}","name":"Test Service for Matching"}]}}`
2. Extract UID from creation response: `data.payment_requests[].uid where state='pending' and matter_uid matches`
3. Run the test with this fresh UID
4. **Cleanup**: `PUT /business/payments/v1/carts/{uid}/cancel`

**payment_uid**:
1. **Create fresh test entity**: `POST /platform/v1/payments`
   - Body template: `{"payment":{"title":"Test Payment for Matching","amount":"{{amount}}","currency":"USD","payment_method":"Cash","client_id":"{{client_uid}}","conversation_id":"{{matter_uid}}","offline":true}}`
2. Extract UID from creation response: `data.payments[] where conversation_id matches matter_uid and amount <= payment_request amount`
3. Run the test with this fresh UID

```json
{
  "payment_status_uid": {
    "source_endpoint": "GET /business/payments/v1/payment_requests",
    "extract_from": "data.payment_requests[].uid where state='pending' and matter_uid matches",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": "POST /business/payments/v1/carts",
    "create_body": {
      "cart": {
        "client_uid": "{{client_uid}}",
        "matter_uid": "{{matter_uid}}",
        "currency": "USD",
        "items": [
          {
            "qty": 1,
            "entity_type": "Service",
            "entity_uid": "{{service_uid}}",
            "price": "{{amount}}",
            "name": "Test Service for Matching"
          }
        ]
      }
    },
    "cleanup_endpoint": "PUT /business/payments/v1/carts/{uid}/cancel",
    "cleanup_note": "Cart/payment request should be cancelled after test to avoid leaving pending requests"
  },
  "payment_uid": {
    "source_endpoint": "GET /platform/v1/payments",
    "extract_from": "data.payments[] where conversation_id matches matter_uid and amount <= payment_request amount",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": "POST /platform/v1/payments",
    "create_body": {
      "payment": {
        "title": "Test Payment for Matching",
        "amount": "{{amount}}",
        "currency": "USD",
        "payment_method": "Cash",
        "client_id": "{{client_uid}}",
        "conversation_id": "{{matter_uid}}",
        "offline": true
      }
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
null
```