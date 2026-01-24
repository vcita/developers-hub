---
endpoint: POST /platform/v1/payment/packages
domain: sales
tags: []
status: pass
savedAt: 2026-01-23T22:51:29.485Z
verifiedAt: 2026-01-23T22:51:29.485Z
timesReused: 0
---
# Create Packages

## Summary
Successfully created package after resolving service ID issue. The original request used invalid numeric service IDs (1, 2) instead of valid service UIDs from the system.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| service_ids | /platform/v1/services?business_id=pihawe0kf7fu7xo1 | N/A | No |

```json
{
  "service_ids": {
    "source_endpoint": "/platform/v1/services?business_id=pihawe0kf7fu7xo1",
    "resolved_value": "nd7zqtlqlq0wda4s, raj8aqjta9gz99vi",
    "used_fallback": false,
    "fallback_endpoint": "N/A"
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
  "path": "/platform/v1/payment/packages",
  "body": {
    "name": "Premium Service Package",
    "description": "A comprehensive package including multiple services",
    "price": 299.99,
    "currency": "USD",
    "discount_amount": 50,
    "discount_unit": "F",
    "expiration": 6,
    "expiration_unit": "M",
    "image_path": "/images/packages/premium-package.jpg",
    "online_payment_enabled": true,
    "items": [
      {
        "total_bookings": 5,
        "services": [
          {
            "id": "nd7zqtlqlq0wda4s",
            "total_bookings": 3
          },
          {
            "id": "raj8aqjta9gz99vi",
            "total_bookings": 2
          }
        ]
      }
    ],
    "products": [
      {
        "id": "xebbbc9f5hgdgu1a",
        "quantity": 2
      }
    ]
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| items.services.id | Documentation shows service IDs as simple integers (1, 2) in the example request, but the API requires actual service UIDs (alphanumeric strings like 'nd7zqtlqlq0wda4s') | Update the example request to use realistic service UIDs instead of simple integers, or clarify that service IDs must be obtained from GET /platform/v1/services | critical |