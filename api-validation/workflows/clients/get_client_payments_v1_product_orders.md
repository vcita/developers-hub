---
endpoint: GET /client/payments/v1/product_orders
domain: clients
tags: []
status: verified
savedAt: 2026-01-23T08:36:31.662Z
verifiedAt: 2026-01-23T08:36:31.662Z
timesReused: 0
---
# Get Product orders

## Summary
Successfully resolved GET /client/payments/v1/product_orders by using the correct client token type. The endpoint returned a list of 13 product orders with details including payment status, pricing, and associated entities.

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
  "path": "/client/payments/v1/product_orders"
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| authentication | Endpoint documentation should clearly specify that this client-facing endpoint requires a 'client' token type, not the default 'staff' token | Add authentication requirements section specifying token_type: client for all /client/* endpoints | major |