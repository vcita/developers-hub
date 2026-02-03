---
endpoint: GET /platform/v1/clients/{client_id}/payment/client_packages
domain: clients
tags: []
status: success
savedAt: 2026-02-02T20:39:46.043Z
verifiedAt: 2026-02-02T20:39:46.043Z
timesReused: 0
---
# Get Client packages

## Summary
Endpoint works successfully with fallback URL and staff token, returning 200 with empty client_packages array. Primary URL returns 422 Unauthorized due to routing/gateway configuration issue.

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
  "path": "/platform/v1/clients/{{resolved.uid}}/payment/client_packages"
}
```