---
endpoint: POST /platform/v1/clients/payment/client_packages/update_usage
domain: clients
tags: []
status: success
savedAt: 2026-01-25T20:49:52.326Z
verifiedAt: 2026-01-25T20:49:52.326Z
timesReused: 0
---
# Create Update usage

## Summary
Successfully resolved authentication and UID issues. Endpoint works with client token and returns expected 422 error when prerequisites aren't met.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| payment_status_id | GET /client/payments/v1/payment_requests | data.payment_requests[0].uid | - | DELETE /platform/v1/payment/client_packages/{uid} |

### Resolution Steps

**payment_status_id**:
1. Call `GET /client/payments/v1/payment_requests`
2. Extract from response: `data.payment_requests[0].uid`
3. If empty, create via `POST /platform/v1/payment/client_packages`

```json
{
  "payment_status_id": {
    "source_endpoint": "GET /client/payments/v1/payment_requests",
    "extract_from": "data.payment_requests[0].uid",
    "fallback_endpoint": "POST /platform/v1/payment/client_packages",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": {
      "client_uid": "3lf5pm2472o5g895",
      "package_id": "d6l0y9icbn5v34re",
      "matter_uid": "dqbqxo258gmaqctk",
      "valid_from": "2024-01-01"
    },
    "cleanup_endpoint": "DELETE /platform/v1/payment/client_packages/{uid}",
    "cleanup_note": "Client packages can be deleted via business payments API"
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