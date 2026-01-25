---
endpoint: GET /client/payments/v1/packages/{package_id}
domain: clients
tags: []
status: success
savedAt: 2026-01-25T19:47:14.779Z
verifiedAt: 2026-01-25T19:47:14.779Z
timesReused: 0
---
# Get Packages

## Summary
Successfully retrieved package information using package_id "d6l0y9icbn5v34re" from created test package. The endpoint returned detailed package data including services and pricing information.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| package_id | POST /platform/v1/payment/packages | data.package.id | ✓ POST /platform/v1/payment/packages | DELETE /platform/v1/payment/packages/{uid} |

### Resolution Steps

**package_id**:
1. **Create fresh test entity**: `POST /platform/v1/payment/packages`
   - Body template: `{"name":"Test Package {{timestamp}}","active":true,"currency":"USD","price":"100.0","description":"Test package for API testing","online_payment_enabled":true,"expiration":1,"expiration_unit":"M","total_bookings":10,"discount_amount":0,"discount_unit":"f","items":[{"total_bookings":10,"services":[{"id":"erfdz36nlraflwdq"}]}],"products":[]}`
2. Extract UID from creation response: `data.package.id`
3. Run the test with this fresh UID
4. **Cleanup**: `DELETE /platform/v1/payment/packages/{uid}`

```json
{
  "package_id": {
    "source_endpoint": "POST /platform/v1/payment/packages",
    "extract_from": "data.package.id",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": "POST /platform/v1/payment/packages",
    "create_body": {
      "name": "Test Package {{timestamp}}",
      "active": true,
      "currency": "USD",
      "price": "100.0",
      "description": "Test package for API testing",
      "online_payment_enabled": true,
      "expiration": 1,
      "expiration_unit": "M",
      "total_bookings": 10,
      "discount_amount": 0,
      "discount_unit": "f",
      "items": [
        {
          "total_bookings": 10,
          "services": [
            {
              "id": "erfdz36nlraflwdq"
            }
          ]
        }
      ],
      "products": []
    },
    "cleanup_endpoint": "DELETE /platform/v1/payment/packages/{uid}",
    "cleanup_note": "Package can be deleted via DELETE endpoint if cleanup is needed"
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
  "method": "GET",
  "path": "/client/payments/v1/packages/{{resolved.uid}}"
}
```