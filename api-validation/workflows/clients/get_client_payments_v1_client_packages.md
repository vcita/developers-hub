---
endpoint: GET /client/payments/v1/client_packages
domain: clients
tags: []
status: success
savedAt: 2026-01-26T05:22:28.017Z
verifiedAt: 2026-01-26T05:22:28.017Z
timesReused: 0
---
# Get Client packages

## Summary
Test passes when matter_uid parameter is included in query string. The endpoint requires matter_uid to function correctly, returning client packages for that matter. Without matter_uid, the endpoint returns 'Unauthorized' instead of the expected data.

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
  "path": "/client/payments/v1/client_packages"
}
```