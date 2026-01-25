---
endpoint: GET /client/payments/v1/client_packages
domain: clients
tags: []
status: success
savedAt: 2026-01-25T20:52:46.235Z
verifiedAt: 2026-01-25T20:52:46.235Z
timesReused: 0
---
# Get Client packages

## Summary
Test passes with matter_uid parameter. The original error was due to missing required matter_uid query parameter.

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
  "path": "/client/payments/v1/client_packages?matter_uid=dqbqxo258gmaqctk"
}
```