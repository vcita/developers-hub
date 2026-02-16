---
endpoint: POST /v3/payment_processing/payment_gateway_assignments
domain: sales
tags: []
status: success
savedAt: 2026-01-27T04:20:22.927Z
verifiedAt: 2026-01-27T04:20:22.927Z
timesReused: 0
---
# Create Payment gateway assignments

## Summary
Test passes after resolving gateway_uid with a valid payment gateway UID from GET /v3/payment_processing/payment_gateways endpoint. Used PayPal wallet gateway which wasn't already assigned to the directory.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| gateway_uid | GET /v3/payment_processing/payment_gateways | data.payment_gateways[4].uid | - | DELETE /v3/payment_processing/payment_gateway_assignments/{uid} |

### Resolution Steps

**gateway_uid**:
1. Call `GET /v3/payment_processing/payment_gateways`
2. Extract from response: `data.payment_gateways[4].uid`

```json
{
  "gateway_uid": {
    "source_endpoint": "GET /v3/payment_processing/payment_gateways",
    "extract_from": "data.payment_gateways[4].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": "DELETE /v3/payment_processing/payment_gateway_assignments/{uid}",
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
  "path": "/v3/payment_processing/payment_gateway_assignments",
  "body": {
    "gateway_uid": "{{resolved.gateway_uid}}",
    "directory_uid": "{{resolved.directory_uid}}"
  }
}
```