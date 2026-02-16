---
endpoint: GET /platform/v1/businesses/{business_uid}/wizards/{wizard_name}
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-28T11:38:44.577Z
verifiedAt: 2026-01-28T11:38:44.577Z
timesReused: 0
---
# Get Wizards

## Summary
Endpoint works correctly. Returns HTTP 200 with wizard data for valid wizard names and appropriate error message for invalid wizard names. Successfully tested with multiple valid wizard names (os_wizard, payment_wizard).

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| wizard_name | GET /platform/v1/businesses/{business_id}/wizards | data array - use 'name' field from any wizard object | - | No cleanup needed - read-only operation |

### Resolution Steps

**wizard_name**:
1. Call `GET /platform/v1/businesses/{business_id}/wizards`
2. Extract from response: `data array - use 'name' field from any wizard object`

```json
{
  "wizard_name": {
    "source_endpoint": "GET /platform/v1/businesses/{business_id}/wizards",
    "extract_from": "data array - use 'name' field from any wizard object",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - read-only operation"
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
  "method": "GET",
  "path": "/platform/v1/businesses/{{resolved.uid}}/wizards/payment_wizard"
}
```