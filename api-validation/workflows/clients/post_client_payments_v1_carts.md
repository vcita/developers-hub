---
endpoint: POST /client/payments/v1/carts
domain: clients
tags: []
status: success
savedAt: 2026-01-25T20:47:06.714Z
verifiedAt: 2026-01-25T20:47:06.714Z
timesReused: 0
---
# Create Carts

## Summary
Successfully created cart after resolving valid entity types and creating test ProductOrder. The endpoint requires a ProductOrder entity and valid currency.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| product_order_id | GET /business/payments/v1/products | first product ID from GET response | - | DELETE /business/payments/v1/product_orders/{uid} |

### Resolution Steps

**product_order_id**:
1. **Create fresh test entity**: `POST /business/payments/v1/product_orders`
   - Body template: `{"product_order":{"matter_uid":"{{matter_uid}}","product_id":"{{product_id}}"}}`
2. Extract UID from creation response: `first product ID from GET response`
3. Run the test with this fresh UID
4. **Cleanup**: `DELETE /business/payments/v1/product_orders/{uid}`

```json
{
  "product_order_id": {
    "source_endpoint": "GET /business/payments/v1/products",
    "extract_from": "first product ID from GET response",
    "fallback_endpoint": "POST /business/payments/v1/product_orders",
    "create_fresh": false,
    "create_endpoint": "POST /business/payments/v1/product_orders",
    "create_body": {
      "product_order": {
        "matter_uid": "{{matter_uid}}",
        "product_id": "{{product_id}}"
      }
    },
    "cleanup_endpoint": "DELETE /business/payments/v1/product_orders/{uid}",
    "cleanup_note": "ProductOrder cleanup via business endpoint"
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