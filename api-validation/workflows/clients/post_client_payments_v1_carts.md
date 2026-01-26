---
endpoint: POST /client/payments/v1/carts
domain: clients
tags: []
status: success
savedAt: 2026-01-26T05:16:19.589Z
verifiedAt: 2026-01-26T05:16:19.589Z
timesReused: 0
---
# Create Carts

## Summary
Successfully created cart using client token with valid entity_type 'ProductOrder' and corresponding entity_uid. The error was caused by using invalid test data ('test_string') for entity_type field.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| product_order_uid | POST /business/payments/v1/product_orders | data.product_order.id | ✓ Yes | ProductOrders are automatically linked to payment requests and cannot be easily cleaned up without affecting payment state |

### Resolution Steps

**product_order_uid**:
1. **Create fresh test entity**: `undefined`
   - Body template: `{"product_order":{"matter_uid":"{{matter_uid}}","client_uid":"{{client_uid}}","product_id":"{{product_id_from_get_products}}","product_quantity":1}}`
2. Extract UID from creation response: `data.product_order.id`
3. Run the test with this fresh UID
4. **Cleanup note**: ProductOrders are automatically linked to payment requests and cannot be easily cleaned up without affecting payment state

```json
{
  "product_order_uid": {
    "source_endpoint": "POST /business/payments/v1/product_orders",
    "extract_from": "data.product_order.id",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": null,
    "create_body": {
      "product_order": {
        "matter_uid": "{{matter_uid}}",
        "client_uid": "{{client_uid}}",
        "product_id": "{{product_id_from_get_products}}",
        "product_quantity": 1
      }
    },
    "cleanup_endpoint": null,
    "cleanup_note": "ProductOrders are automatically linked to payment requests and cannot be easily cleaned up without affecting payment state"
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
  "path": "/client/payments/v1/carts",
  "body": {
    "cart": {
      "currency": "USD",
      "items": [
        {
          "entity_type": "ProductOrder",
          "entity_uid": "{{resolved.entity_uid}}"
        }
      ],
      "matter_uid": "{{config.params.matter_uid}}"
    }
  }
}
```