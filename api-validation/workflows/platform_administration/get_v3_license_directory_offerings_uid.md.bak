---
endpoint: GET /v3/license/directory_offerings/{uid}
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-29T09:06:49.080Z
verifiedAt: 2026-01-29T09:06:49.080Z
timesReused: 0
---
# Get Directory offerings

## Summary
Test passes. The original UID didn't exist, so I resolved it by fetching a valid UID from the list endpoint. The endpoint works correctly with admin token as documented.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /v3/license/directory_offerings | data.directory_offerings[0].uid | - | No cleanup needed - using existing DirectoryOffering |

### Resolution Steps

**uid**:
1. Call `GET /v3/license/directory_offerings`
2. Extract from response: `data.directory_offerings[0].uid`

```json
{
  "uid": {
    "source_endpoint": "GET /v3/license/directory_offerings",
    "extract_from": "data.directory_offerings[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - using existing DirectoryOffering"
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
  "path": "/v3/license/directory_offerings/{{resolved.uid}}"
}
```