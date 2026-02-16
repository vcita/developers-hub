---
endpoint: POST /platform/v1/webhook/subscribe
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-28T10:09:42.228Z
verifiedAt: 2026-01-28T10:09:42.228Z
timesReused: 0
---
# Create Subscribe

## Summary
Test passes after correcting parameter names. The swagger documentation has incorrect field names - actual implementation expects 'event' and 'target_url' instead of 'entity' and 'event_type'.

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
  "path": "/platform/v1/webhook/subscribe",
  "body": {
    "event": "client/created",
    "target_url": "https://example.com/webhook"
  }
}
```