---
endpoint: GET /client/payments/v1/invoices
domain: clients
tags: []
status: verified
savedAt: 2026-01-23T08:35:14.319Z
verifiedAt: 2026-01-23T08:35:14.319Z
timesReused: 0
---
# Get Invoices

## Summary
Fixed authentication issue by using client token instead of staff token for client-facing endpoint

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
  "path": "/client/payments/v1/invoices"
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| token_type | Client-facing endpoint /client/payments/v1/invoices requires client token authentication but was being tested with staff token | Update API documentation to clearly indicate this endpoint requires client token authentication, not staff token | major |