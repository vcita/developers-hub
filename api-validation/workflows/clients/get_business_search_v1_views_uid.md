---
endpoint: GET /business/search/v1/views/{uid}
domain: clients
tags: []
status: success
savedAt: 2026-01-25T20:58:20.245Z
verifiedAt: 2026-01-25T20:58:20.245Z
timesReused: 0
---
# Get Views

## Summary
Test passed successfully after resolving UID. The endpoint GET /business/search/v1/views/{uid} works correctly when provided with a valid view UID.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /business/search/v1/views | data[0].uid | - | DELETE /business/search/v1/views/{uid} |

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
    "create_body": {
      "name": "Test View {{timestamp}}",
      "description": "A test view",
      "columns": [
        {
          "label": "First Name",
          "type": "string",
          "identifier": "first_name",
          "sortable": true,
          "sort_options": {}
        }
      ],
      "filter": "[]",
      "level": "staff",
      "pinned": false
    },
    "cleanup_endpoint": "DELETE /business/search/v1/views/{uid}",
    "cleanup_note": "Views can be deleted using the DELETE endpoint"
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