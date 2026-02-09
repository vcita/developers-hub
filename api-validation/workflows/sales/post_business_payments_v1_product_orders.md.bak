---
endpoint: POST /business/payments/v1/product_orders
domain: sales
tags: []
status: success
savedAt: 2026-01-26T21:30:04.269Z
verifiedAt: 2026-01-26T21:30:04.269Z
timesReused: 0
---
# Create Product orders

## Summary
Test passes after replacing placeholder tax_id with valid tax ID from GET /business/payments/v1/taxes. The original request used "test_string" for tax_ids which caused a 422 error, but with valid tax ID "qa5va78pi0jk6gts" the request succeeds with HTTP 201.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| tax_ids | GET /business/payments/v1/taxes | data.taxes[0].id | - | Tax resources are business-scoped and can be reused |

### Resolution Steps

**tax_ids**:
1. **Create fresh test entity**: `POST /business/payments/v1/taxes`
2. Extract UID from creation response: `data.taxes[0].id`
3. Run the test with this fresh UID
4. **Cleanup note**: Tax resources are business-scoped and can be reused

```json
{
  "tax_ids": {
    "source_endpoint": "GET /business/payments/v1/taxes",
    "extract_from": "data.taxes[0].id",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": "POST /business/payments/v1/taxes",
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Tax resources are business-scoped and can be reused"
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
  "path": "/business/payments/v1/product_orders",
  "body": {
    "product_order": {
      "client_id": "{{config.params.client_id}}",
      "matter_uid": "{{config.params.matter_uid}}",
      "price": 1,
      "product_id": "{{resolved.product_id}}",
      "tax_ids": [
        "{{resolved.uid}}"
      ]
    }
  }
}
```