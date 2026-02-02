---
endpoint: PUT /platform/v1/businesses/{business_id}/wizards/{wizard_name}
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-29T08:10:55.188Z
verifiedAt: 2026-01-29T08:10:55.188Z
timesReused: 0
---
# Update Wizards

## Summary
Test passes with directory token and minimal update body. Original failure was due to empty request body and missing wizard_name parameter.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| wizard_name | GET /platform/v1/businesses/{business_id}/wizards | data[0].name | - | Wizard updates don't require cleanup - they're configuration changes |

### Resolution Steps

**wizard_name**:
1. Call `GET /platform/v1/businesses/{business_id}/wizards`
2. Extract from response: `data[0].name`

```json
{
  "wizard_name": {
    "source_endpoint": "GET /platform/v1/businesses/{business_id}/wizards",
    "extract_from": "data[0].name",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Wizard updates don't require cleanup - they're configuration changes"
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