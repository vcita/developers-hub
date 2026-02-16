---
endpoint: POST /v3/apps/staff_widgets_boards_templates
domain: apps
tags: []
status: success
savedAt: 2026-01-25T05:29:22.437Z
verifiedAt: 2026-01-25T05:29:22.437Z
timesReused: 0
---
# Create Staff widgets boards templates

## Summary
Test passed after removing existing template. The endpoint requires deleting any existing active template before creating a new one, which is documented in the swagger description.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| template_uid | GET /v3/apps/staff_widgets_boards_templates | data.staff_widgets_boards_templates[0].uid (for existing template) | ✓ POST /v3/apps/staff_widgets_boards_templates | DELETE /v3/apps/staff_widgets_boards_templates/{uid} |

### Resolution Steps

**template_uid**:
1. **Create fresh test entity**: `POST /v3/apps/staff_widgets_boards_templates`
   - Body template: `{"staff_uid":"{{staff_uid}}"}`
2. Extract UID from creation response: `data.staff_widgets_boards_templates[0].uid (for existing template)`
3. Run the test with this fresh UID
4. **Cleanup**: `DELETE /v3/apps/staff_widgets_boards_templates/{uid}`

```json
{
  "template_uid": {
    "source_endpoint": "GET /v3/apps/staff_widgets_boards_templates",
    "extract_from": "data.staff_widgets_boards_templates[0].uid (for existing template)",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": "POST /v3/apps/staff_widgets_boards_templates",
    "create_body": {
      "staff_uid": "{{staff_uid}}"
    },
    "cleanup_endpoint": "DELETE /v3/apps/staff_widgets_boards_templates/{uid}",
    "cleanup_note": "Must delete existing template before creating new one due to uniqueness constraint"
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
  "path": "/v3/apps/staff_widgets_boards_templates",
  "body": {
    "staff_uid": "{{config.params.staff_uid}}"
  }
}
```