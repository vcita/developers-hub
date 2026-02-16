---
endpoint: POST /business/payments/v1/carts
domain: sales
tags: []
status: success
savedAt: 2026-01-26T21:21:40.109Z
verifiedAt: 2026-01-26T21:21:40.109Z
timesReused: 0
---
# Create Carts

## Summary
Test passes after fixing entity_type validation and discount structure. Used valid Service entity_type with existing service UID and corrected discount to use only percent (not both percent and amount).

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| service_uid | GET /platform/v1/services | data.services[0].id | - | - |

### Resolution Steps

**service_uid**:
1. Call `GET /platform/v1/services`
2. Extract from response: `data.services[0].id`

```json
{
  "service_uid": {
    "source_endpoint": "GET /platform/v1/services",
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
  "path": "/business/payments/v1/carts",
  "body": {
    "cart": {
      "currency": "USD",
      "items": [
        {
          "amount": 100,
          "description": "Test service item",
          "discount": {
            "percent": 10
          },
          "entity_name": "Demo class / event",
          "entity_type": "Service",
          "entity_uid": "{{resolved.entity_uid}}",
          "taxes": [
            {
              "name": "Test Tax",
              "rate": 10
            }
          ]
        }
      ],
      "matter_uid": "{{config.params.matter_uid}}"
    },
    "is_sale": true
  }
}
```