---
endpoint: PUT /platform/v1/clients/{client_id}
domain: clients
tags: []
status: success
savedAt: 2026-01-26T05:35:08.437Z
verifiedAt: 2026-01-26T05:35:08.437Z
timesReused: 0
---
# Update Clients

## Summary
Successfully updated client after creating a fresh test client. The original error was due to an email uniqueness constraint violation.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| client_id | POST /platform/v1/clients | data.client.id | ✓ Yes | Client remains for future testing |

### Resolution Steps

**client_id**:
1. **Create fresh test entity**: `undefined`
   - Body template: `{"email":"testclient123456@example.com","first_name":"Test","last_name":"Client","phone":"+1-555-123-4567","staff_id":"g7n82lrc4ztic4cp"}`
2. Extract UID from creation response: `data.client.id`
3. Run the test with this fresh UID
4. **Cleanup note**: Client remains for future testing

```json
{
  "client_id": {
    "source_endpoint": "POST /platform/v1/clients",
    "extract_from": "data.client.id",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": null,
    "create_body": {
      "email": "testclient123456@example.com",
      "first_name": "Test",
      "last_name": "Client",
      "phone": "+1-555-123-4567",
      "staff_id": "g7n82lrc4ztic4cp"
    },
    "cleanup_endpoint": null,
    "cleanup_note": "Client remains for future testing"
  }
}
```

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
    "address": "123 Test Street, Test City, TC 12345",
    "custom_field1": "Test Custom Field 1",
    "custom_field2": "Test Custom Field 2",
    "custom_field3": "Test Custom Field 3",
    "email": "updated-testclient123456@example.com",
    "first_name": "Updated",
    "force_nullifying": false,
    "last_name": "Client",
    "mobile_phone": "+1-555-123-4567",
    "phone": "+1-555-987-6543",
    "spam": false,
    "staff_id": "{{config.params.staff_id}}",
    "status": "lead",
    "tags": "updated, test"
  }
}
```