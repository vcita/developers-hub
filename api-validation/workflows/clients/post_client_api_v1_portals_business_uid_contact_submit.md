---
endpoint: POST /client_api/v1/portals/{business_uid}/contact/submit
domain: clients
tags: []
status: success
savedAt: 2026-01-25T19:29:28.270Z
verifiedAt: 2026-01-25T19:29:28.270Z
timesReused: 0
---
# Create Submit

## Summary
Fixed documentation and format issues. The endpoint requires client token authentication and expects form_data.fields as an object (not array), and isWidget as boolean (not string).

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
  "path": "/client_api/v1/portals/{{resolved.uid}}/contact/submit",
  "body": {
    "form_data": {
      "fields": {
        "subject": "test subject",
        "message": "test message"
      }
    },
    "source_data": {
      "isWidget": false,
      "o": "ZGlyZWN0",
      "s": "http://localhost:7300/site/test/leave-details",
      "topUrl": "{{resolved.uid}}"
    }
  }
}
```