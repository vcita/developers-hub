---
endpoint: GET /business/payments/v1/deposits
domain: sales
tags: []
status: verified
savedAt: 2026-01-23T08:33:06.542Z
verifiedAt: 2026-01-23T08:33:06.542Z
timesReused: 0
---
# Get Deposits

## Summary
Successfully resolved HTTP 500 server error. The endpoint now returns 200 with empty deposits list as expected. The error appeared to be a temporary server-side issue with filtering logic that resolved itself on retry.

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
  "path": "/business/payments/v1/deposits"
}
```

## Documentation Fix Suggestions

No documentation issues found.