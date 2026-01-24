---
endpoint: GET /client/payments/v1/payment_requests
domain: clients
tags: []
status: verified
savedAt: 2026-01-23T08:35:35.656Z
verifiedAt: 2026-01-23T08:35:35.656Z
timesReused: 0
---
# Get Payment requests

## Summary
Successfully resolved the test by using the correct client token for authentication

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
  "path": "/client/payments/v1/payment_requests"
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| authentication | The endpoint documentation should specify that it requires client token authentication | Add authentication requirements to the API documentation specifying that this client-facing endpoint requires a client token instead of staff token | major |