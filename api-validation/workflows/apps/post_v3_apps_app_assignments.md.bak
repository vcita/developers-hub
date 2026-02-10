---
endpoint: POST /v3/apps/app_assignments
domain: apps
tags: []
status: success
savedAt: 2026-01-25T05:27:52.104Z
verifiedAt: 2026-01-25T05:27:52.104Z
timesReused: 0
---
# Create App assignments

## Summary
Test passes after using directory token and valid app_code_name. The endpoint requires directory token authentication and an existing app code name.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| assignee_uid | From config - pihawe0kf7fu7xo1 | Uses business_uid from available parameters | - | No cleanup needed - uses existing business |
| directory_uid | Auto-resolved by directory token | Automatically determined from directory token context | - | No cleanup needed - auto-populated by API |
| app_code_name | GET /platform/v1/apps | data.apps[0].app_code_name or select from available apps | - | Assignment can be cleaned up via DELETE /v3/apps/app_assignments/{uid} |

### Resolution Steps

**assignee_uid**:
1. Call `From config - pihawe0kf7fu7xo1`
2. Extract from response: `Uses business_uid from available parameters`

**directory_uid**:
1. Call `Auto-resolved by directory token`
2. Extract from response: `Automatically determined from directory token context`

**app_code_name**:
1. Call `GET /platform/v1/apps`
2. Extract from response: `data.apps[0].app_code_name or select from available apps`
3. If empty, create via `POST /platform/v1/apps`

```json
{
  "assignee_uid": {
    "source_endpoint": "From config - pihawe0kf7fu7xo1",
    "extract_from": "Uses business_uid from available parameters",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - uses existing business"
  },
  "directory_uid": {
    "source_endpoint": "Auto-resolved by directory token",
    "extract_from": "Automatically determined from directory token context",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - auto-populated by API"
  },
  "app_code_name": {
    "source_endpoint": "GET /platform/v1/apps",
    "extract_from": "data.apps[0].app_code_name or select from available apps",
    "fallback_endpoint": "POST /platform/v1/apps",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Assignment can be cleaned up via DELETE /v3/apps/app_assignments/{uid}"
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
  "path": "/v3/apps/app_assignments",
  "body": {
    "assignee_type": "business",
    "assignee_uid": "{{resolved.assignee_uid}}",
    "app_code_name": "testapp123456",
    "settings": {
      "assignment_mode": "internal"
    }
  }
}
```