---
endpoint: POST /platform/v1/apps/{id}/assign
domain: apps
tags: []
status: success
savedAt: 2026-01-25T06:04:53.337Z
verifiedAt: 2026-01-25T06:04:53.337Z
timesReused: 0
---
# Create Assign

## Summary
Successfully tested both directory and business app assignments. The endpoint works correctly when provided with proper parameters: directory_uid with is_internal for directory assignments, or business_uid with hide_from_market for business assignments.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| directory_uid | GET /platform/v1/directory/branding | data.uid | - | - |
| app_code_name | GET /platform/v1/apps | first available app_code_name | - | - |

### Resolution Steps

**directory_uid**:
1. Call `GET /platform/v1/directory/branding`
2. Extract from response: `data.uid`

**app_code_name**:
1. Call `GET /platform/v1/apps`
2. Extract from response: `first available app_code_name`
3. If empty, create via `POST /platform/v1/apps`

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
  },
  "app_code_name": {
    "source_endpoint": "GET /platform/v1/apps",
    "extract_from": "first available app_code_name",
    "fallback_endpoint": "POST /platform/v1/apps",
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
  "path": "/platform/v1/apps/testapp123457/assign",
  "body": {
    "business_uid": "{{config.params.business_uid}}",
    "hide_from_market": "true"
  }
}
```