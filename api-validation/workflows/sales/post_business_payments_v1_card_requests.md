---
endpoint: POST /business/payments/v1/card_requests
domain: sales
tags: []
status: success
savedAt: 2026-01-26T21:20:10.231Z
verifiedAt: 2026-01-26T21:20:10.231Z
timesReused: 0
---
# Create Card requests

## Summary
Test passes after fixing channel parameter. The API only accepts 'email' or 'sms' as valid channel values, not 'test_string'.

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
  "path": "/business/payments/v1/card_requests",
  "body": {
    "card_request": {
      "alpha2": "US",
      "channel": "email",
      "channel_value": "test@example.com",
      "client_uid": "{{config.params.client_uid}}"
    }
  }
}
```