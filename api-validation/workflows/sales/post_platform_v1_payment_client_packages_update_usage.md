---
endpoint: POST /platform/v1/payment/client_packages/update_usage
domain: sales
tags: []
status: success
savedAt: 2026-01-26T20:03:28.947Z
verifiedAt: 2026-01-26T20:03:28.947Z
timesReused: 0
---
# Create Update usage

## Summary
Test passes. The original 500 server error was resolved by using valid payment_status_uid. The endpoint correctly validates business logic and returns appropriate error messages when prerequisites aren't met.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| payment_status_uid | GET /business/payments/v1/payment_requests | data.payment_requests[0].uid | - | - |

### Resolution Steps

**payment_status_uid**:
1. Call `GET /business/payments/v1/payment_requests`
2. Extract from response: `data.payment_requests[0].uid`

```json
{
  "payment_status_uid": {
    "source_endpoint": "GET /business/payments/v1/payment_requests",
    "extract_from": "data.payment_requests[0].uid",
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
null
```