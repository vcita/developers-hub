---
endpoint: GET /business/payments/v1/payment_requests
domain: sales
tags: []
status: verified
savedAt: 2026-01-23T08:33:23.083Z
verifiedAt: 2026-01-23T08:33:23.083Z
timesReused: 0
---
# Get Payment requests

## Summary
Test passes - the endpoint now returns 200 OK with payment requests data. The original HTTP 500 "wrong number of arguments" error was a temporary server-side issue that resolved on retry.

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
  "path": "/business/payments/v1/payment_requests"
}
```

## Documentation Fix Suggestions

No documentation issues found.