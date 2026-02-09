---
endpoint: PUT /business/payments/v1/product_orders/{product_order_id}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:29:54.779Z
verifiedAt: 2026-01-26T22:29:54.779Z
timesReused: 0
---
# Update Product orders

## Summary
Test passes. The product order was successfully updated. Original error was caused by using 'test_string' as tax_id instead of a valid tax ID.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| tax_ids | GET /business/payments/v1/taxes | data.taxes[].id | - | - |

### Resolution Steps

**tax_ids**:
1. Call `GET /business/payments/v1/taxes`
2. Extract from response: `data.taxes[].id`

```json
{
  "tax_ids": {
    "source_endpoint": "GET /business/payments/v1/taxes",
    "extract_from": "data.taxes[].id",
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
  "method": "PUT",
  "path": "/business/payments/v1/product_orders/{{resolved.uid}}",
  "body": {
    "product_order": {
      "price": 1,
      "tax_ids": [
        "{{resolved.uid}}"
      ]
    }
  }
}
```