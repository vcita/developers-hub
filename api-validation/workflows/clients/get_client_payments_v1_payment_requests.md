---
endpoint: GET /client/payments/v1/payment_requests
domain: clients
tags: []
status: success
savedAt: 2026-01-25T10:12:52.839Z
verifiedAt: 2026-01-25T10:12:52.839Z
timesReused: 0
---
# Get Payment requests

## Summary
Test passed successfully. The endpoint returned payment requests data correctly with HTTP 200. The original HTTP 500 error appears to have been temporary or related to system state at the time of the initial failure.

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
  "path": "/client/payments/v1/payment_requests"
}
```