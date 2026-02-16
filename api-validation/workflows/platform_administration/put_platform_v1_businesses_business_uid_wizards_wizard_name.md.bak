---
endpoint: PUT /platform/v1/businesses/{business_uid}/wizards/{wizard_name}
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-28T19:11:37.635Z
verifiedAt: 2026-01-28T19:11:37.635Z
timesReused: 0
---
# Update Wizards

## Summary
Successfully updated wizard using directory token. Initial 401 errors resolved by using correct token type (directory instead of default). Wizard must exist to be updated.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| wizard_name | GET /platform/v1/businesses/{business_id}/wizards | data array - use 'name' field from any wizard | - | No cleanup needed - updating existing wizards is safe |

### Resolution Steps

**wizard_name**:
1. Call `GET /platform/v1/businesses/{business_id}/wizards`
2. Extract from response: `data array - use 'name' field from any wizard`

```json
{
  "wizard_name": {
    "source_endpoint": "GET /platform/v1/businesses/{business_id}/wizards",
    "extract_from": "data array - use 'name' field from any wizard",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - updating existing wizards is safe"
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
  "path": "/platform/v1/businesses/{{resolved.uid}}/wizards/os_wizard",
  "body": {
    "completed": true
  }
}
```