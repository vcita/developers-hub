---
endpoint: "GET /business/search/v1/views/{uid}"
domain: clients
tags: []
swagger: "swagger/clients/legacy/manage_clients.json"
status: verified
savedAt: "2026-02-02T20:42:10.371Z"
verifiedAt: "2026-02-02T20:42:10.371Z"
timesReused: 0
useFallbackApi: true
---
# Get Views

## Summary
Endpoint works correctly. Original 404 error was due to invalid UID. Need to use fallback URL as primary gateway returns 404 Bad Gateway.

## Prerequisites
None required for this endpoint.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /business/search/v1/views | data[0].uid | - | Views are business data, no cleanup needed for testing |

### Resolution Steps

**uid**:
1. Call `GET /business/search/v1/views`
2. Extract from response: `data[0].uid`



## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Test Request

Use this template with dynamically resolved UIDs:

```json
{
  "method": "GET",
  "path": "/business/search/v1/views/{{resolved.uid}}"
}
```