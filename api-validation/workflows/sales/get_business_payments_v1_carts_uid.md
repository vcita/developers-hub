---
endpoint: GET /business/payments/v1/carts/{uid}
domain: sales
tags: []
status: verified
savedAt: 2026-01-23T08:46:08.483Z
verifiedAt: 2026-01-23T08:46:08.483Z
timesReused: 0
---
# Get Carts

## Summary
Successfully resolved cart UID and retrieved cart data. Found an existing cart UID "uec0e756qgsp2m3h" from the payment requests list where payable_type was "Cart".

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| uid | GET /business/payments/v1/payment_requests | POST /business/payments/v1/carts | No |

```json
{
  "uid": {
    "source_endpoint": "GET /business/payments/v1/payment_requests",
    "resolved_value": "uec0e756qgsp2m3h",
    "used_fallback": false,
    "fallback_endpoint": "POST /business/payments/v1/carts"
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "GET",
  "path": "/business/payments/v1/carts/uec0e756qgsp2m3h"
}
```

## Documentation Fix Suggestions

No documentation issues found.