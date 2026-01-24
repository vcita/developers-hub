---
endpoint: POST /business/payments/v1/products
domain: sales
tags: []
status: pass
savedAt: 2026-01-23T22:11:29.996Z
verifiedAt: 2026-01-23T22:11:29.996Z
timesReused: 0
---
# Create Products

## Summary
Successfully created a product after resolving tax_ids and SKU uniqueness issues. The endpoint works correctly but requires valid tax IDs from the business and unique SKUs.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| tax_ids | /business/payments/v1/taxes | - | No |

```json
{
  "tax_ids": {
    "source_endpoint": "/business/payments/v1/taxes",
    "resolved_value": "[\"gnj99at2dsc2ncl2\", \"knz1ggec0m013584\"]",
    "used_fallback": false,
    "fallback_endpoint": null
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/business/payments/v1/products",
  "body": {
    "product": {
      "name": "Legal Consultation Service",
      "price": 150,
      "cost": 75,
      "currency": "USD",
      "description": "One-hour legal consultation with experienced attorney",
      "display": true,
      "image_url": "https://example.com/images/consultation.jpg",
      "sku": "LEGAL-CONSULT-UNIQUE-001",
      "tax_ids": [
        "gnj99at2dsc2ncl2",
        "knz1ggec0m013584"
      ]
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| tax_ids | Documentation shows example tax_ids as simple strings like 'tax_standard' and 'tax_service', but the API requires actual tax ID values from the business's tax list obtained via GET /business/payments/v1/taxes | Update example to show realistic tax_ids like actual UUIDs, and add note that tax_ids must be from the business's existing taxes list via GET /business/payments/v1/taxes | major |
| sku | Documentation doesn't mention that SKUs must be unique across the business, leading to 422 errors when testing with the same SKU | Add note that SKU must be unique within the business and will return 422 error if already exists | minor |