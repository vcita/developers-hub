---
endpoint: POST /business/payments/v1/payment_requests/{payment_request_id}/send_link
domain: sales
tags: []
status: success
savedAt: 2026-01-26T21:29:31.220Z
verifiedAt: 2026-01-26T21:29:31.220Z
timesReused: 0
---
# Create Send link

## Summary
Test passes with valid channel value. The 'channel' parameter must be either 'email' or 'sms', not 'test_string'.

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
  "method": "POST",
  "path": "/business/payments/v1/payment_requests/{{resolved.uid}}/send_link",
  "body": {
    "channel": "email"
  }
}
```