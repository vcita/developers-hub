---
endpoint: GET /client/payments/v1/payment_requests/{payment_request_uid}/checkout
domain: clients
tags: []
status: verified
savedAt: 2026-01-23T08:35:50.458Z
verifiedAt: 2026-01-23T08:35:50.458Z
timesReused: 0
---
# Get Checkout

## Summary
Successfully resolved the failing test by using the correct 'client' token type. The endpoint requires client-level authentication to access checkout sessions.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "GET",
  "path": "/client/payments/v1/payment_requests/539i6m75rjzgzodi/checkout"
}
```

## Documentation Fix Suggestions

No documentation issues found.