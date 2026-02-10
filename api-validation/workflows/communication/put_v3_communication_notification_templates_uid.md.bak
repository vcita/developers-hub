---
endpoint: PUT /v3/communication/notification_templates/{uid}
domain: communication
tags: []
status: success
savedAt: 2026-01-27T06:51:33.256Z
verifiedAt: 2026-01-27T06:51:33.256Z
timesReused: 0
---
# Update Notification templates

## Summary
Test passes after fixing deep_link validation format. The deep_link fields must start with '/' and follow specific validation rules.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | - | data[0].uid or data[0].id | - | - |

### Resolution Steps

**uid**:

```json
{
  "uid": {
    "source_endpoint": null,
    "extract_from": "first item uid",
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
  "method": "PUT",
  "path": "/v3/communication/notification_templates/{{resolved.uid}}",
  "body": {
    "title": [
      {
        "locale": "en",
        "value": "test_string"
      }
    ],
    "description": [
      {
        "locale": "en",
        "value": "test_string"
      }
    ],
    "category": "payments",
    "configurable_by_staff": true,
    "content": {
      "staff_portal": {
        "title": [
          {
            "locale": "en",
            "value": "test_string"
          }
        ],
        "message_body": [
          {
            "locale": "en",
            "value": "test_string"
          }
        ],
        "deep_link": "/app/settings"
      },
      "email": {
        "subject": [
          {
            "locale": "en",
            "value": "test_string"
          }
        ],
        "top_image": {
          "url": "test_string",
          "width": 1,
          "alt": [
            {
              "locale": "en",
              "value": "test_string"
            }
          ]
        },
        "main_title": [
          {
            "locale": "en",
            "value": "test_string"
          }
        ],
        "main_text": [
          {
            "locale": "en",
            "value": "test_string"
          }
        ],
        "middle_image": {
          "url": "test_string",
          "width": 1,
          "alt": [
            {
              "locale": "en",
              "value": "test_string"
            }
          ]
        },
        "middle_text": [
          {
            "locale": "en",
            "value": "test_string"
          }
        ],
        "footer_text": [
          {
            "locale": "en",
            "value": "test_string"
          }
        ],
        "primary_cta_button": {
          "text": [
            {
              "locale": "en",
              "value": "test_string"
            }
          ],
          "url": "test_string",
          "alt": [
            {
              "locale": "en",
              "value": "test_string"
            }
          ]
        },
        "secondary_cta_button": {
          "text": [
            {
              "locale": "en",
              "value": "test_string"
            }
          ],
          "url": "test_string",
          "alt": [
            {
              "locale": "en",
              "value": "test_string"
            }
          ]
        }
      },
      "sms": {
        "message_body": [
          {
            "locale": "en",
            "value": "test_string"
          }
        ],
        "deep_link": "/app/clients/${client_uid}"
      }
    }
  }
}
```