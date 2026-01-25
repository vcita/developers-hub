---
endpoint: POST /v3/apps/staff_widgets_boards
domain: apps
tags: []
status: success
savedAt: 2026-01-25T05:28:44.779Z
verifiedAt: 2026-01-25T05:28:44.779Z
timesReused: 0
---
# Create Staff widgets boards

## Summary
Test passes after resolving uniqueness constraint and using valid widget_uid. The original failure was due to: 1) Duplication error - staff already had a board with type 'home', and 2) Invalid widget_uid 'test_string'.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| widget_uid | GET /v3/apps/staff_widgets_boards | Extract from existing boards' widgets array - data.staffWidgetsBoards[].sections[].widgets[].uid | - | DELETE /v3/apps/staff_widgets_boards/{uid} |

### Resolution Steps

**widget_uid**:
1. **Create fresh test entity**: `POST /v3/apps/staff_widgets_boards`
   - Body template: `{"board_layout_code_name":"MainAndSideBar2Columns","type":"test-unique-{{timestamp}}","sections":[{"code_name":"main","widgets":[{"widget_uid":"{{resolved_widget_uid}}","dimensions":{"height":1,"width":1}}]}]}`
2. Extract UID from creation response: `Extract from existing boards' widgets array - data.staffWidgetsBoards[].sections[].widgets[].uid`
3. Run the test with this fresh UID
4. **Cleanup**: `DELETE /v3/apps/staff_widgets_boards/{uid}`

```json
{
  "widget_uid": {
    "source_endpoint": "GET /v3/apps/staff_widgets_boards",
    "extract_from": "Extract from existing boards' widgets array - data.staffWidgetsBoards[].sections[].widgets[].uid",
    "fallback_endpoint": "POST /v3/apps/widgets",
    "create_fresh": false,
    "create_endpoint": "POST /v3/apps/staff_widgets_boards",
    "create_body": {
      "board_layout_code_name": "MainAndSideBar2Columns",
      "type": "test-unique-{{timestamp}}",
      "sections": [
        {
          "code_name": "main",
          "widgets": [
            {
              "widget_uid": "{{resolved_widget_uid}}",
              "dimensions": {
                "height": 1,
                "width": 1
              }
            }
          ]
        }
      ]
    },
    "cleanup_endpoint": "DELETE /v3/apps/staff_widgets_boards/{uid}",
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
  "path": "/v3/apps/staff_widgets_boards",
  "body": {
    "board_layout_code_name": "{{resolved.uid}}",
    "type": "test-unique-1737823095",
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