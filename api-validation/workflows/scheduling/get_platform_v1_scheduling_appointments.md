---
endpoint: GET /platform/v1/scheduling/appointments
domain: scheduling
tags: []
status: success
savedAt: 2026-02-02T08:57:56.257Z
verifiedAt: 2026-02-02T08:57:56.257Z
timesReused: 0
---
# Get Appointments

## Summary
Endpoint works successfully with app token, returning 200 OK with appointments list. Documentation correctly states both Staff and App tokens are supported, and the test passes with app token.

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
  "path": "/platform/v1/scheduling/appointments"
}
```