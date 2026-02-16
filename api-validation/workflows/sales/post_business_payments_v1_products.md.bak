---
endpoint: POST /business/payments/v1/products
domain: sales
tags: []
status: success
savedAt: 2026-01-26T21:30:28.948Z
verifiedAt: 2026-01-26T21:30:28.948Z
timesReused: 0
---
# Create Products

## Summary
Test passes after resolving validation issues. Replaced test values with valid tax_ids, supported currency, and unique SKU.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| tax_ids | GET /business/payments/v1/taxes | data.taxes[0].id | - | - |
| supported_currency | GET /platform/v1/payment/settings | data.payment_settings.supported_currencies[0] | - | - |

### Resolution Steps

**tax_ids**:
1. Call `GET /business/payments/v1/taxes`
2. Extract from response: `data.taxes[0].id`

**supported_currency**:
1. Call `GET /platform/v1/payment/settings`
2. Extract from response: `data.payment_settings.supported_currencies[0]`

```json
{
  "tax_ids": {
    "source_endpoint": "GET /business/payments/v1/taxes",
    "extract_from": "data.taxes[0].id",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
  },
  "supported_currency": {
    "source_endpoint": "GET /platform/v1/payment/settings",
    "extract_from": "data.payment_settings.supported_currencies[0]",
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
  "path": "/business/payments/v1/products",
  "body": {
    "product": {
      "cost": 1,
      "currency": "USD",
      "description": "test_string",
      "display": true,
      "image_url": "test_string",
      "name": "test_string",
      "price": 1,
      "sku": "test_sku_1704067200000",
      "tax_ids": [
        "{{resolved.uid}}"
      ]
    }
  }
}
```