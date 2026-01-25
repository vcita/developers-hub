---
endpoint: PUT /v3/apps/staff_widgets_boards/{uid}
domain: apps
tags: []
status: success
savedAt: 2026-01-25T05:34:59.650Z
verifiedAt: 2026-01-25T05:34:59.650Z
timesReused: 0
---
# Update Staff widgets boards

## Summary
Successfully updated Staff Widgets Board after resolving widget_uid and using existing board

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| widget_uid | GET /v3/apps/widgets | data.uid | ✓ POST /v3/apps/widgets | Widget cleanup not needed - widgets are scoped to test apps |
| staff_widgets_board_uid | GET /v3/apps/staff_widgets_boards | data.staffWidgetsBoards[0].uid | - | Board cleanup not needed - existing boards are reusable |

### Resolution Steps

**widget_uid**:
1. **Create fresh test entity**: `POST /v3/apps/widgets`
   - Body template: `{"name":"Test Widget {{timestamp}}","display_name":{"en":"Test Widget {{timestamp}}"},"widget_type":"calendar","dimensions":{"height":1,"width":1,"min_width":1,"max_width":4,"min_height":1,"max_height":4},"component_data":{"name":"test-component"},"settings":{}}`
2. Extract UID from creation response: `data.uid`
3. Run the test with this fresh UID
4. **Cleanup note**: Widget cleanup not needed - widgets are scoped to test apps

**staff_widgets_board_uid**:
1. Call `GET /v3/apps/staff_widgets_boards`
2. Extract from response: `data.staffWidgetsBoards[0].uid`

```json
{
  "widget_uid": {
    "source_endpoint": "GET /v3/apps/widgets",
    "extract_from": "data.uid",
    "fallback_endpoint": "POST /v3/apps/widgets",
    "create_fresh": true,
    "create_endpoint": "POST /v3/apps/widgets",
    "create_body": {
      "name": "Test Widget {{timestamp}}",
      "display_name": {
        "en": "Test Widget {{timestamp}}"
      },
      "widget_type": "calendar",
      "dimensions": {
        "height": 1,
        "width": 1,
        "min_width": 1,
        "max_width": 4,
        "min_height": 1,
        "max_height": 4
      },
      "component_data": {
        "name": "test-component"
      },
      "settings": {}
    },
    "cleanup_endpoint": null,
    "cleanup_note": "Widget cleanup not needed - widgets are scoped to test apps"
  },
  "staff_widgets_board_uid": {
    "source_endpoint": "GET /v3/apps/staff_widgets_boards",
    "extract_from": "data.staffWidgetsBoards[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Board cleanup not needed - existing boards are reusable"
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
  "path": "/v3/apps/staff_widgets_boards/{{resolved.uid}}",
  "body": {
    "board_layout_code_name": "{{resolved.uid}}",
    "type": "home",
    "sections": [
      {
        "code_name": "main",
        "widgets": [
          {
            "widget_uid": "{{resolved.widget_uid}}",
            "dimensions": {
              "height": 1,
              "width": 1
            }
          }
        ]
      }
    ]
  }
}
```