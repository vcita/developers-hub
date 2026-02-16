---
endpoint: GET /platform/v1/businesses/{business_uid}/wizards
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-27T09:24:23.044Z
verifiedAt: 2026-01-27T09:24:23.044Z
timesReused: 0
---
# Get Wizards

## Summary
Test passes with HTTP 200. Required directory token authentication - staff token was insufficient.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| business_id | Already resolved from config | Available as ttumxdlyzqo6j8pf | - | No cleanup needed - using existing business |

### Resolution Steps

**business_id**:
1. Call `Already resolved from config`
2. Extract from response: `Available as ttumxdlyzqo6j8pf`

```json
{
  "business_id": {
    "source_endpoint": "Already resolved from config",
    "extract_from": "Available as ttumxdlyzqo6j8pf",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - using existing business"
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
  "path": "/platform/v1/businesses/{{resolved.uid}}/wizards"
}
```