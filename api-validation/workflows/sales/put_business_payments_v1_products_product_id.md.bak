---
endpoint: PUT /business/payments/v1/products/{product_id}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:30:27.011Z
verifiedAt: 2026-01-26T22:30:27.011Z
timesReused: 0
---
# Update Products

## Summary
Test passes. The original failure was due to using a non-unique SKU value. After updating the SKU to "unique-sku-1734709873" and using a valid tax_id, the product update succeeded with HTTP 200.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| product_id | GET /business/payments/v1/products | data.products[].id | - | No cleanup needed - product updated in place |
| tax_ids | GET /business/payments/v1/taxes | data.taxes[].id | - | Tax IDs are existing system entities, no cleanup needed |

### Resolution Steps

**product_id**:
1. Call `GET /business/payments/v1/products`
2. Extract from response: `data.products[].id`

**tax_ids**:
1. Call `GET /business/payments/v1/taxes`
2. Extract from response: `data.taxes[].id`

```json
{
  "product_id": {
    "source_endpoint": "GET /business/payments/v1/products",
    "extract_from": "data.products[].id",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - product updated in place"
  },
  "tax_ids": {
    "source_endpoint": "GET /business/payments/v1/taxes",
    "extract_from": "data.taxes[].id",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Tax IDs are existing system entities, no cleanup needed"
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
  "path": "/business/payments/v1/products/{{resolved.uid}}",
  "body": {
    "product": {
      "cost": 1,
      "description": "Updated test description",
      "display": true,
      "image_url": "https://example.com/updated-image.jpg",
      "name": "Updated test product",
      "price": 15.99,
      "sku": "unique-sku-1734709873",
      "tax_ids": [
        "{{resolved.uid}}"
      ]
    }
  }
}
```