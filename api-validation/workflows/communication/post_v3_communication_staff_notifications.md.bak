---
endpoint: POST /v3/communication/staff_notifications
domain: communication
tags: []
status: success
savedAt: 2026-01-27T06:22:34.971Z
verifiedAt: 2026-01-27T06:22:34.971Z
timesReused: 0
---
# Create Staff notifications

## Summary
Test passes after resolving notification template code name and using directory token. The endpoint successfully created a StaffNotification with HTTP 201.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| notification_template_code_name | GET /v3/communication/notification_templates | data.notification_templates[].code_name | - | - |

### Resolution Steps

**notification_template_code_name**:
1. Call `GET /v3/communication/notification_templates`
2. Extract from response: `data.notification_templates[].code_name`
3. If empty, create via `POST /v3/communication/notification_templates`

```json
{
  "notification_template_code_name": {
    "source_endpoint": "GET /v3/communication/notification_templates",
    "extract_from": "data.notification_templates[].code_name",
    "fallback_endpoint": "POST /v3/communication/notification_templates",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": {
      "code_name": "test_template_{{timestamp}}",
      "title": [
        {
          "locale": "en",
          "value": "Test Template"
        }
      ],
      "description": [
        {
          "locale": "en",
          "value": "Test template for staff notifications"
        }
      ],
      "category": "messages",
      "configurable_by_staff": true,
      "trigger_type": "system",
      "delivery_channel": [
        "push",
        "pane"
      ],
      "content": {
        "staff_portal": {
          "title": [
            {
              "locale": "en",
              "value": "Test Title"
            }
          ],
          "message_body": [
            {
              "locale": "en",
              "value": "Test message"
            }
          ]
        }
      }
    },
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
  "path": "/v3/communication/staff_notifications",
  "body": {
    "staff_uid": "{{config.params.staff_uid}}",
    "notification_template_code_name": "test_template_1734462000",
    "locale": "en",
    "params": [
      {
        "key": "test_string",
        "value": "test_string"
      }
    ]
  }
}
```