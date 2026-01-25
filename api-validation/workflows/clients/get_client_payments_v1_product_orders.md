---
endpoint: GET /client/payments/v1/product_orders
domain: clients
tags: []
status: success
savedAt: 2026-01-25T20:54:59.281Z
verifiedAt: 2026-01-25T20:54:59.281Z
timesReused: 0
---
# Get Product orders

## Summary
Successfully retrieved product orders list using client token. The endpoint returned HTTP 200 with a list of product orders including details like id, client_id, product_id, staff_id, price, currency, and payment status.

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
  "path": "/client/payments/v1/product_orders"
}
```