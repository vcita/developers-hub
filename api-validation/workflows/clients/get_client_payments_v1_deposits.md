---
endpoint: GET /client/payments/v1/deposits
domain: clients
tags: []
status: verified
savedAt: 2026-01-23T08:34:57.724Z
verifiedAt: 2026-01-23T08:34:57.724Z
timesReused: 0
---
# Get Deposits

## Summary
Test now passes. The issue was using the wrong token type - this client-facing endpoint requires the 'client' token instead of the default 'staff' token.

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
  "path": "/client/payments/v1/deposits"
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| authentication | Documentation should clarify that /client/payments/v1/deposits requires 'client' token authentication, not 'staff' token | Add authentication requirements to the endpoint documentation specifying that this endpoint requires client-level authentication | major |