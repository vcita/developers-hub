---
endpoint: POST /client_api/v1/portals/{business_uid}/contact/submit
domain: clients
tags: []
status: success
savedAt: 2026-02-02T20:21:53.155Z
verifiedAt: 2026-02-02T20:21:53.155Z
timesReused: 0
---
# Create Submit

## Summary
Successfully submitted Leave Details Form. The endpoint requires specific field structure obtained from the GET form endpoint, with 'subject' and 'message' fields properly populated in form_data.fields.

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
        "subject": "Test Leave Request",
        "message": "This is a test message for the leave details form submission."
      }
    }
  }
}
```