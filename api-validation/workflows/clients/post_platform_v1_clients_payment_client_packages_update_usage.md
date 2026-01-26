---
endpoint: POST /platform/v1/clients/payment/client_packages/update_usage
domain: clients
tags: []
status: success
savedAt: 2026-01-25T23:12:26.084Z
verifiedAt: 2026-01-25T23:12:26.084Z
timesReused: 0
---
# Create Update usage

## Summary
Endpoint works correctly. Using a valid payment_status_id and client token, the endpoint returns 422 with expected business logic error 'There is no package to use' when client has no suitable packages.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| payment_status_id | GET /business/payments/v1/payment_requests | data.payment_requests[0].uid | - | PaymentStatus entities are managed by the payment system and shouldn't be deleted during testing |

### Resolution Steps

**payment_status_id**:
1. Call `GET /business/payments/v1/payment_requests`
2. Extract from response: `data.payment_requests[0].uid`

```json
{
  "payment_status_id": {
    "source_endpoint": "GET /business/payments/v1/payment_requests",
    "extract_from": "data.payment_requests[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "PaymentStatus entities are managed by the payment system and shouldn't be deleted during testing"
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