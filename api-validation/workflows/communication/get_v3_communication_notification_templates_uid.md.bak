---
endpoint: GET /v3/communication/notification_templates/{uid}
domain: communication
tags: []
status: success
savedAt: 2026-01-27T06:42:19.749Z
verifiedAt: 2026-01-27T06:42:19.749Z
timesReused: 0
---
# Get Notification templates

## Summary
Test passes. Endpoint successfully retrieves NotificationTemplate with directory token. Original test failed due to invalid UID - resolved by fetching existing template UID from GET /v3/communication/notification_templates.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| notification_template_uid | GET /v3/communication/notification_templates | data.notification_templates[0].uid | - | - |

### Resolution Steps

**notification_template_uid**:
1. **Create fresh test entity**: `POST /v3/communication/notification_templates`
2. Extract UID from creation response: `data.notification_templates[0].uid`
3. Run the test with this fresh UID

```json
{
  "notification_template_uid": {
    "source_endpoint": "GET /v3/communication/notification_templates",
    "extract_from": "data.notification_templates[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": "POST /v3/communication/notification_templates",
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
  "method": "GET",
  "path": "/v3/communication/notification_templates/{{resolved.uid}}"
}
```