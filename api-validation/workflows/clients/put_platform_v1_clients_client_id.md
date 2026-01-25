---
endpoint: PUT /platform/v1/clients/{client_id}
domain: clients
tags: []
status: success
savedAt: 2026-01-25T21:07:06.176Z
verifiedAt: 2026-01-25T21:07:06.176Z
timesReused: 0
---
# Update Clients

## Summary
Successfully updated a client. The test initially failed due to email uniqueness constraint and invalid status value, but succeeded after using a unique email and correct status value ('lead'). All UID fields were already resolved in configuration.

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
  "method": "PUT",
  "path": "/platform/v1/clients/{{resolved.uid}}",
  "body": {
    "address": "123 Main Street",
    "first_name": "{{resolved.uid}}",
    "last_name": "UpdatedLastName",
    "email": "updated.client.test@example.com",
    "mobile_phone": "+1-555-0123",
    "phone": "+1-555-0124",
    "status": "lead",
    "custom_field1": "Updated Custom Field 1",
    "custom_field2": "Updated Custom Field 2",
    "custom_field3": "Updated Custom Field 3",
    "tags": "updated,test",
    "spam": false,
    "force_nullifying": false,
    "staff_id": "{{config.params.staff_id}}"
  }
}
```