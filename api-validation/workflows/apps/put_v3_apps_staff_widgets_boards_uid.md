---
endpoint: PUT /v3/apps/staff_widgets_boards/{uid}
domain: apps
tags: []
status: pass
savedAt: 2026-01-24T13:29:36.698Z
verifiedAt: 2026-01-24T13:29:36.698Z
timesReused: 0
---
# Update Staff widgets boards

## Summary
Successfully updated Staff Widgets Board after identifying that the original request contained invalid widget UIDs. The endpoint works correctly when using valid widget UIDs from existing widgets.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| uid | GET /v3/apps/staff_widgets_boards | - | No |

```json
{
  "uid": {
    "source_endpoint": "GET /v3/apps/staff_widgets_boards",
    "resolved_value": "8a761bb7-444b-462f-813f-fe738904cd9c",
    "used_fallback": false,
    "fallback_endpoint": null
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "PUT",
  "path": "/v3/apps/staff_widgets_boards/8a761bb7-444b-462f-813f-fe738904cd9c",
  "body": {
    "board_layout_code_name": "MainAndSideBar2Columns",
    "type": "home",
    "sections": [
      {
        "code_name": "main_section",
        "widgets": [
          {
            "widget_uid": "33321644-a7c7-4062-bf85-a21bb36bc2e8",
            "dimensions": {
              "width": 6,
              "height": 2
            }
          }
        ]
      }
    ]
  }
}
```