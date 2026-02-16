---
endpoint: POST /business/messaging/v1/channels/typing
domain: communication
tags: []
status: success
savedAt: 2026-01-27T06:19:17.837Z
verifiedAt: 2026-01-27T06:19:17.837Z
timesReused: 0
---
# Create Typing

## Summary
Test passes after providing a valid client UID from GET /platform/v1/clients. The endpoint requires either 'uid' or 'contact_uid' in the contact object, and when source='business', it uses the external typing status flow.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| client_uid | GET /platform/v1/clients | data.clients[0].id | - | - |

### Resolution Steps

**client_uid**:
1. Call `GET /platform/v1/clients`
2. Extract from response: `data.clients[0].id`

```json
{
  "client_uid": {
    "source_endpoint": "GET /platform/v1/clients",
    "extract_from": "data.clients[0].id",
    "fallback_endpoint": null,
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
  "path": "/business/messaging/v1/channels/typing",
  "body": {
    "contact": {
      "uid": "{{resolved.uid}}",
      "channel_uid": "test_channel_123",
      "external_uid": "ext_123",
      "source": "business",
      "typing": true
    }
  }
}
```