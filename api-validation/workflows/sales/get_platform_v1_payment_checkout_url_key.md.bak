---
endpoint: GET /platform/v1/payment/checkout/{url_key}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:06:09.436Z
verifiedAt: 2026-01-26T22:06:09.436Z
timesReused: 0
---
# Get Checkout

## Summary
Test passes. The checkout endpoint successfully retrieves checkout information when provided with a valid payment request UID as the url_key parameter. Used existing payment request UID '86fgkwzpk85tw434' from GET /business/payments/v1/payment_requests.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| url_key | GET /business/payments/v1/payment_requests | data.payment_requests[0].uid | - | No cleanup needed - using existing payment requests for read-only checkout operations |

### Resolution Steps

**url_key**:
1. Call `GET /business/payments/v1/payment_requests`
2. Extract from response: `data.payment_requests[0].uid`
3. If empty, create via `POST /business/payments/v1/payment_requests`

```json
{
  "url_key": {
    "source_endpoint": "GET /business/payments/v1/payment_requests",
    "extract_from": "data.payment_requests[0].uid",
    "fallback_endpoint": "POST /business/payments/v1/payment_requests",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": {
      "matter_uid": "{{matter_uid}}",
      "client_uid": "{{client_uid}}",
      "amount": "100.00",
      "currency": "USD"
    },
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - using existing payment requests for read-only checkout operations"
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
  "path": "/platform/v1/payment/checkout/{{resolved.uid}}"
}
```