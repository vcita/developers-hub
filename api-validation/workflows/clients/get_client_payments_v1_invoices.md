---
endpoint: GET /client/payments/v1/invoices
domain: clients
tags: []
status: success
savedAt: 2026-01-26T05:22:48.274Z
verifiedAt: 2026-01-26T05:22:48.274Z
timesReused: 0
---
# Get Invoices

## Summary
Test passes successfully. The endpoint requires client token authentication as documented. Using token_type='client' returns HTTP 200 with a valid list of invoices.

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
  "path": "/client/payments/v1/invoices"
}
```