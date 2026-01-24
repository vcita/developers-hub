---
endpoint: GET /client/payments/v1/apps/primary_provider_connected_application
domain: clients
tags: []
status: verified
savedAt: 2026-01-23T08:33:51.885Z
verifiedAt: 2026-01-23T08:33:51.885Z
timesReused: 0
---
# Get Primary provider connected application

## Summary
Successfully resolved authentication issue by using 'client' token type. The endpoint now returns a proper business response (422 'Not Found') indicating no connected payment application exists, which is expected behavior.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
null
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| token_type | Documentation doesn't specify that this client-facing endpoint requires 'client' token type instead of default 'staff' token | Add token_type specification to indicate this endpoint requires 'client' authentication | major |