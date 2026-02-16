---
endpoint: POST /platform/v1/payment/packages
domain: sales
tags: []
status: success
savedAt: 2026-01-27T04:23:18.093Z
verifiedAt: 2026-01-27T04:23:18.093Z
timesReused: 0
---
# Create Packages

## Summary
Test passes after resolving service ID and using valid currency, discount_unit, and expiration_unit values.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| service_id | GET /platform/v1/services?business_id=88pzdbz1hmkdoel4 | data.services[0].id | - | - |

### Resolution Steps

**service_id**:
1. Call `GET /platform/v1/services?business_id=88pzdbz1hmkdoel4`
2. Extract from response: `data.services[0].id`

```json
{
  "service_id": {
    "source_endpoint": "GET /platform/v1/services?business_id=88pzdbz1hmkdoel4",
    "extract_from": "data.services[0].id",
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
  "path": "/platform/v1/payment/packages",
  "body": {
    "currency": "USD",
    "description": "test_string",
    "discount_amount": 1,
    "discount_unit": "F",
    "expiration": 1,
    "expiration_unit": "M",
    "image_path": "test_string",
    "items": [
      {
        "services": [
          {
            "id": "{{resolved.id}}"
          }
        ],
        "total_bookings": 1
      }
    ],
    "name": "test_string",
    "online_payment_enabled": true,
    "price": 1,
    "products": []
  }
}
```