---
endpoint: GET /client/payments/v1/cards/get_new_card
domain: clients
tags: []
status: verified
savedAt: 2026-01-23T08:34:14.588Z
verifiedAt: 2026-01-23T08:34:14.588Z
timesReused: 0
---
# Get Get new card

## Summary
Endpoint fixed by using correct token type. The client-facing endpoint requires 'client' token instead of default 'staff' token.

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
  "path": "/client/payments/v1/cards/get_new_card"
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| token_type | Documentation doesn't specify that this client-facing endpoint requires 'client' token authentication | Add authentication requirement documentation specifying that this endpoint requires client token authentication | major |