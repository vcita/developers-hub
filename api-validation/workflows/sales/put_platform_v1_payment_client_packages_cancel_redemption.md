---
endpoint: PUT /platform/v1/payment/client_packages/cancel_redemption
domain: sales
tags: []
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: success
savedAt: 2026-01-26T15:29:29.195Z
verifiedAt: 2026-01-26T15:29:29.195Z
timesReused: 0
---
# Update Cancel redemption

## Summary
Test passes after UID resolution. Original HTTP 500 error was due to invalid placeholder value 'test_string'. With valid payment_status_id, endpoint returns proper HTTP 422 business logic error.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| payment_status_id | GET /platform/v1/clients/{client_id}/payment/client_packages | data.client_packages[0].payment_status_id | - | - |

### Resolution Steps

**payment_status_id**:
1. Call `GET /platform/v1/clients/{client_id}/payment/client_packages`
2. Extract from response: `data.client_packages[0].payment_status_id`
3. If empty, create via `POST /platform/v1/payment/client_packages`

```json
{
  "payment_status_id": {
    "source_endpoint": "GET /platform/v1/clients/{client_id}/payment/client_packages",
    "extract_from": "data.client_packages[0].payment_status_id",
    "fallback_endpoint": "POST /platform/v1/payment/client_packages",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": {
      "client_id": "{{client_id}}",
      "package_id": "{{package_id}}",
      "matter_uid": "{{matter_uid}}",
      "valid_from": "2026-01-26",
      "valid_until": "2028-01-26"
    },
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
null
```