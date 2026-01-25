---
endpoint: POST /platform/v1/clients
domain: clients
tags: []
status: success
savedAt: 2026-01-25T20:47:59.779Z
verifiedAt: 2026-01-25T20:47:59.779Z
timesReused: 0
---
# Create Clients

## Summary
Successfully created a client after resolving staff_id format and email uniqueness issues. The endpoint returns HTTP 201 with client data and JWT token.

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
  "path": "/platform/v1/clients",
  "body": {
    "address": "123 Main St",
    "custom_field1": "Custom Value 1",
    "custom_field2": "Custom Value 2",
    "custom_field3": "Custom Value 3",
    "email": "client1735671695@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "opt_in_transactional_sms": true,
    "phone": "+1234567890",
    "source_campaign": "Test Campaign",
    "source_channel": "web",
    "source_name": "Website Form",
    "source_url": "https://example.com/contact",
    "staff_id": "{{config.params.staff_id}}",
    "status": "lead",
    "tags": "new,test"
  }
}
```