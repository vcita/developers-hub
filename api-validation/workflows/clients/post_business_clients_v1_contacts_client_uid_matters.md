---
endpoint: POST /business/clients/v1/contacts/{client_uid}/matters
domain: clients
tags: []
status: success
savedAt: 2026-01-25T20:42:07.800Z
verifiedAt: 2026-01-25T20:42:07.800Z
timesReused: 0
---
# Create Matters

## Summary
Successfully created a new matter after discovering that the Name field is required. The original request failed with a "missing_field" error for field "wrytui9q48as6ovw" (the Name field), which is required when creating matters for clients who already have matters or when creating new matters in certain business configurations.

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
  "path": "/business/clients/v1/contacts/{{resolved.uid}}/matters",
  "body": {
    "matter": {
      "fields": [
        {
          "uid": "{{resolved.uid}}",
          "value": "Test Matter"
        }
      ],
      "note": "test_string",
      "tags": [
        "test_string"
      ]
    }
  }
}
```