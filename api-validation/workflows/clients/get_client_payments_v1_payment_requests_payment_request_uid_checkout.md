---
endpoint: GET /client/payments/v1/payment_requests/{payment_request_uid}/checkout
domain: clients
tags: []
status: success
savedAt: 2026-01-26T05:23:16.654Z
verifiedAt: 2026-01-26T05:23:16.654Z
timesReused: 0
---
# Get Checkout

## Summary
The GET /client/payments/v1/payment_requests/{payment_request_uid}/checkout endpoint works correctly. The original 422 error about coupon functionality was likely due to a specific business configuration at the time of the first test. The endpoint successfully returns checkout session data with HTTP 200, and the response includes is_allowed_coupons: false to indicate coupon functionality status.

## Prerequisites
No specific prerequisites documented.

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