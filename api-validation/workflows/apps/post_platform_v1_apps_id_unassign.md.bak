---
endpoint: POST /platform/v1/apps/{id}/unassign
domain: apps
tags: []
status: success
savedAt: 2026-01-25T06:08:23.820Z
verifiedAt: 2026-01-25T06:08:23.820Z
timesReused: 0
---
# Create Unassign

## Summary
Successfully unassigned app from directory. The endpoint requires app_code_name (string) in the URL path, not numeric app_id. Endpoint returned HTTP 201 with {"assignment": null} indicating successful unassignment.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| directory_uid | GET /platform/v1/directory/branding | data.uid | - | - |

### Resolution Steps

**directory_uid**:
1. Call `GET /platform/v1/directory/branding`
2. Extract from response: `data.uid`

```json
{
  "directory_uid": {
    "source_endpoint": "GET /platform/v1/directory/branding",
    "extract_from": "data.uid",
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
  "method": "POST",
  "path": "/platform/v1/apps/{{resolved.uid}}/unassign",
  "body": {
    "directory_uid": "{{resolved.directory_uid}}"
  }
}
```