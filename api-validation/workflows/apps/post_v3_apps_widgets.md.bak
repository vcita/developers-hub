---
endpoint: POST /v3/apps/widgets
domain: apps
tags: []
status: success
savedAt: 2026-01-25T05:30:13.157Z
verifiedAt: 2026-01-25T05:30:13.157Z
timesReused: 0
---
# Create Widgets

## Summary
Successfully created widget after acquiring proper app token. The endpoint requires an app token from an app with app_type='widgets', which was documented in swagger and confirmed by testing.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| app_with_widgets_type | GET /platform/v1/apps | Find app with app_type='widgets' | - | DELETE /platform/v1/apps/{app_id} |

### Resolution Steps

**app_with_widgets_type**:
1. Call `GET /platform/v1/apps`
2. Extract from response: `Find app with app_type='widgets'`
3. If empty, create via `POST /platform/v1/apps`

```json
{
  "app_with_widgets_type": {
    "source_endpoint": "GET /platform/v1/apps",
    "extract_from": "Find app with app_type='widgets'",
    "fallback_endpoint": "POST /platform/v1/apps",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": {
      "name": "Test Widgets App",
      "app_code_name": "testwidgetapp{{timestamp}}",
      "app_type": "widgets",
      "redirect_uri": "https://example.com/callback"
    },
    "cleanup_endpoint": "DELETE /platform/v1/apps/{app_id}",
    "cleanup_note": "App cleanup available but not required for this test"
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
  "path": "/v3/apps/widgets",
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
    "module": "test_string",
    "component_data": {
      "name": "test_string",
      "config": {}
    }
  }
}
```