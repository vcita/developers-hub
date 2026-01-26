---
endpoint: GET /business/search/v1/views/{uid}
domain: clients
tags: []
status: success
savedAt: 2026-01-26T05:28:17.806Z
verifiedAt: 2026-01-26T05:28:17.806Z
timesReused: 0
---
# Get Views

## Summary
Successfully retrieved a specific view by UID. The original failure was due to using a non-existent view UID. Using a valid UID (n0r6yxumbcp7bstu) from GET /business/search/v1/views returned the expected view details.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /business/search/v1/views | data[0].uid | - | - |

### Resolution Steps

**uid**:
1. Call `GET /business/search/v1/views`
2. Extract from response: `data[0].uid`
3. If empty, create via `POST /business/search/v1/views`

```json
{
  "uid": {
    "source_endpoint": "GET /business/search/v1/views",
    "extract_from": "data[0].uid",
    "fallback_endpoint": "POST /business/search/v1/views",
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
  "path": "/business/search/v1/views/{{resolved.uid}}"
}
```