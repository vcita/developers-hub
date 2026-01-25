---
endpoint: GET /platform/v1/clients/{client_id}/payments
domain: clients
tags: []
status: success
savedAt: 2026-01-25T09:12:43.655Z
verifiedAt: 2026-01-25T09:12:43.655Z
timesReused: 0
---
# Get Payments

## Summary
Test passes when called without query parameters (HTTP 201), but fails with 500 errors when invalid filter syntax is used. Discovered specific filter parameter requirements through source code analysis.

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
  "path": "/platform/v1/clients/{{resolved.uid}}/payments?filter[state][in]=paid"
}
```