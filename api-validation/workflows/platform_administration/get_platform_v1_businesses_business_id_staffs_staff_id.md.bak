---
endpoint: GET /platform/v1/businesses/{business_uid}/staffs/{staff_uid}
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-27T09:24:06.431Z
verifiedAt: 2026-01-27T09:24:06.431Z
timesReused: 0
---
# Get Staffs

## Summary
Test passes with directory token and valid staff ID. Original failure was due to: 1) Wrong token type (used default instead of directory), 2) Invalid staff_id (0fdf1a4928dc79b3 doesn't exist in this business).

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| staff_id | GET /platform/v1/businesses/{business_id}/staffs | data.staff[0].id | - | - |

### Resolution Steps

**staff_id**:
1. Call `GET /platform/v1/businesses/{business_id}/staffs`
2. Extract from response: `data.staff[0].id`

```json
{
  "staff_id": {
    "source_endpoint": "GET /platform/v1/businesses/{business_id}/staffs",
    "extract_from": "data.staff[0].id",
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
  "method": "GET",
  "path": "/platform/v1/businesses/{{resolved.uid}}/staffs/{{resolved.uid}}"
}
```