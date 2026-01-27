---
endpoint: PUT /business/payments/v1/client_packages/{uid}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:21:05.741Z
verifiedAt: 2026-01-26T22:21:05.741Z
timesReused: 0
---
# Update Client packages

## Summary
Test passes. Successfully updated client package after resolving UID and using existing booking_credits structure.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /platform/v1/clients/{client_id}/payment/client_packages | data.client_packages[0].id | - | - |
| booking_credits_id | GET /business/payments/v1/client_packages/{uid} | data.client_package.booking_credits[0].id | - | - |

### Resolution Steps

**uid**:
1. Call `GET /platform/v1/clients/{client_id}/payment/client_packages`
2. Extract from response: `data.client_packages[0].id`

**booking_credits_id**:
1. Call `GET /business/payments/v1/client_packages/{uid}`
2. Extract from response: `data.client_package.booking_credits[0].id`

```json
{
  "uid": {
    "source_endpoint": "GET /platform/v1/clients/{client_id}/payment/client_packages",
    "extract_from": "data.client_packages[0].id",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
  },
  "booking_credits_id": {
    "source_endpoint": "GET /business/payments/v1/client_packages/{uid}",
    "extract_from": "data.client_package.booking_credits[0].id",
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
  "path": "/business/payments/v1/client_packages/{{resolved.uid}}",
  "body": {
    "client_package": {
      "booking_credits": [
        {
          "id": "{{resolved.id}}",
          "total_bookings": 1
        }
      ],
      "valid_until": "2029-01-26"
    }
  }
}
```