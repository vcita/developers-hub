---
endpoint: PUT /v3/apps/staff_widgets_boards_templates/{uid}
domain: apps
tags: []
status: success
savedAt: 2026-01-25T05:35:33.882Z
verifiedAt: 2026-01-25T05:35:33.882Z
timesReused: 0
---
# Update Staff widgets boards templates

## Summary
Test passes with directory token and existing template UID. Original failure was due to using non-existent UID 'f48ad6c8-d99c-4ae1-a245-0d0523f29f67' instead of actual template UID.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /v3/apps/staff_widgets_boards_templates | data.staff_widgets_boards_templates[0].uid | - | DELETE /v3/apps/staff_widgets_boards_templates/{uid} |

### Resolution Steps

**uid**:
1. Call `GET /v3/apps/staff_widgets_boards_templates`
2. Extract from response: `data.staff_widgets_boards_templates[0].uid`

```json
{
  "uid": {
    "source_endpoint": "GET /v3/apps/staff_widgets_boards_templates",
    "extract_from": "data.staff_widgets_boards_templates[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": "DELETE /v3/apps/staff_widgets_boards_templates/{uid}",
    "cleanup_note": "Templates can be deleted if needed"
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
  "path": "/v3/apps/staff_widgets_boards_templates/{{resolved.uid}}",
  "body": {
    "staff_uid": "{{config.params.staff_uid}}"
  }
}
```