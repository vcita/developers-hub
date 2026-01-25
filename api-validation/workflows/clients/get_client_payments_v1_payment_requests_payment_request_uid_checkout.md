---
endpoint: GET /client/payments/v1/payment_requests/{payment_request_uid}/checkout
domain: clients
tags: []
status: success
savedAt: 2026-01-25T20:54:36.580Z
verifiedAt: 2026-01-25T20:54:36.580Z
timesReused: 0
---
# Get Checkout

## Summary
Successfully retrieved checkout session. The endpoint works without authentication (as designed) and returns complete checkout details including payment status, amount, taxes, and accepted payment methods.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| payment_request_uid | GET /client/payments/v1/payment_requests | Available from config parameters | - | Payment request UIDs are from test configuration, no cleanup needed |

### Resolution Steps

**payment_request_uid**:
1. Call `GET /client/payments/v1/payment_requests`
2. Extract from response: `Available from config parameters`

```json
{
  "payment_request_uid": {
    "source_endpoint": "GET /client/payments/v1/payment_requests",
    "extract_from": "Available from config parameters",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Payment request UIDs are from test configuration, no cleanup needed"
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
  "path": "/client/payments/v1/payment_requests/{{resolved.uid}}/checkout"
}
```