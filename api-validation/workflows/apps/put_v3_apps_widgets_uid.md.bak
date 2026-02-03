---
endpoint: PUT /v3/apps/widgets/{uid}
domain: apps
tags: []
status: success
savedAt: 2026-01-25T05:36:16.937Z
verifiedAt: 2026-01-25T05:36:16.937Z
timesReused: 0
---
# Update Widgets

## Summary
Successfully updated widget after creating an app with app_type='widgets' and obtaining the required app token. The original 404 error was due to using a non-existent widget UID. Created a fresh widget and the update operation succeeded.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /v3/apps/widgets | data.widgets[0].uid | ✓ POST /v3/apps/widgets | Widgets are scoped to the app, cleanup happens when the test app is removed |

### Resolution Steps

**uid**:
1. **Create fresh test entity**: `POST /v3/apps/widgets`
   - Body template: `{"display_name":{"en":"Test Widget"},"component_data":{"name":"test_component"},"dimensions":{"width":400,"height":300,"min_width":200,"max_width":800,"min_height":150,"max_height":600}}`
2. Extract UID from creation response: `data.widgets[0].uid`
3. Run the test with this fresh UID
4. **Cleanup note**: Widgets are scoped to the app, cleanup happens when the test app is removed

```json
{
  "uid": {
    "source_endpoint": "GET /v3/apps/widgets",
    "extract_from": "data.widgets[0].uid",
    "fallback_endpoint": "POST /v3/apps/widgets",
    "create_fresh": true,
    "create_endpoint": "POST /v3/apps/widgets",
    "create_body": {
      "display_name": {
        "en": "Test Widget"
      },
      "component_data": {
        "name": "test_component"
      },
      "dimensions": {
        "width": 400,
        "height": 300,
        "min_width": 200,
        "max_width": 800,
        "min_height": 150,
        "max_height": 600
      }
    },
    "cleanup_endpoint": null,
    "cleanup_note": "Widgets are scoped to the app, cleanup happens when the test app is removed"
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
  "path": "/v3/apps/widgets/{{resolved.uid}}",
  "body": {
    "display_name": {
      "en": "test_string",
      "es": "test_string",
      "fr": "test_string",
      "it": "test_string",
      "pt": "test_string",
      "de": "test_string",
      "pl": "test_string",
      "nl": "test_string",
      "he": "test_string",
      "sl": "test_string"
    },
    "component_data": {
      "name": "test_string",
      "config": {}
    },
    "dimensions": {
      "max_height": 1,
      "min_height": 1,
      "height": 1,
      "max_width": 1,
      "min_width": 1,
      "width": 1
    },
    "permissions": [
      "test_string"
    ],
    "module": "test_string"
  }
}
```