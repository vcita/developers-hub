---
endpoint: PUT /platform/v1/payment/packages/{package_id}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:47:12.384Z
verifiedAt: 2026-01-26T22:47:12.384Z
timesReused: 0
---
# Update Packages

## Summary
Test passes after resolving token issue and using valid enum values for expiration_unit and discount_unit fields

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| package_id | Already resolved from config | config.params.package_id | - | - |

### Resolution Steps

**package_id**:
1. Call `Already resolved from config`
2. Extract from response: `config.params.package_id`

```json
{
  "package_id": {
    "source_endpoint": "Already resolved from config",
    "extract_from": "config.params.package_id",
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
  "path": "/platform/v1/payment/packages/{{resolved.uid}}",
  "body": {
    "package": {
      "currency": "USD",
      "description": "Updated test package",
      "discount_amount": 10,
      "discount_unit": "F",
      "expiration": 30,
      "expiration_unit": "M",
      "image_path": "test_image.jpg",
      "items": [
        {
          "services": [
            {
              "id": "{{resolved.id}}"
            }
          ],
          "total_bookings": 5
        }
      ],
      "name": "Updated Test Package",
      "online_payment_enabled": true,
      "price": 99.99,
      "products": []
    }
  }
}
```