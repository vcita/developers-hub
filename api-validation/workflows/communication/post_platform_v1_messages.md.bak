---
endpoint: POST /platform/v1/messages
domain: communication
tags: []
status: success
savedAt: 2026-01-27T06:26:22.574Z
verifiedAt: 2026-01-27T06:26:22.574Z
timesReused: 0
---
# Create Messages

## Summary
Test passes after providing valid conversation_uid and correcting field values. The API requires either a valid conversation_uid or an existing matter for the client.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| conversation_uid | GET /platform/v1/conversations | First conversation ID matching the client_id | - | - |

### Resolution Steps

**conversation_uid**:
1. Call `GET /platform/v1/conversations`
2. Extract from response: `First conversation ID matching the client_id`
3. If empty, create via `Create via messaging or require existing matter`

```json
{
  "conversation_uid": {
    "source_endpoint": "GET /platform/v1/conversations",
    "extract_from": "First conversation ID matching the client_id",
    "fallback_endpoint": "Create via messaging or require existing matter",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
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
  "method": "POST",
  "path": "/platform/v1/messages",
  "body": {
    "message": {
      "channels": "sms,email",
      "client_id": "{{config.params.client_id}}",
      "conversation_title": "Test Message API",
      "direction": "business_to_client",
      "staff_id": "{{config.params.staff_id}}",
      "text": "This is a test message from API",
      "conversation_uid": "{{resolved.conversation_uid}}"
    }
  }
}
```