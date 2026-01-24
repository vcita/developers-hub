---
endpoint: POST /business/search/v1/views/bulk
domain: clients
tags: []
status: pass
savedAt: 2026-01-23T21:57:26.139Z
verifiedAt: 2026-01-23T21:57:26.139Z
timesReused: 0
---
# Create Bulk

## Summary
POST /business/search/v1/views/bulk endpoint works correctly after fixing the request format. The original request failed due to incorrect parameter structure and invalid UIDs.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| view_uids | GET /business/search/v1/views | N/A - existing views were sufficient | Yes |

```json
{
  "view_uids": {
    "source_endpoint": "GET /business/search/v1/views",
    "resolved_value": "cf7ljj1o7i2mr8y2, uncxrzxmmajt5dhe (plus 10 others available)",
    "used_fallback": true,
    "fallback_endpoint": "N/A - existing views were sufficient"
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/business/search/v1/views/bulk",
  "body": {
    "views": [
      {
        "uid": "cf7ljj1o7i2mr8y2",
        "pinned": true,
        "order": 1,
        "name": "Updated View Name"
      },
      {
        "uid": "uncxrzxmmajt5dhe",
        "pinned": false,
        "order": 2,
        "name": "Another Updated View"
      }
    ]
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| views | Documentation shows nested structure with 'updates' object, but API expects flat structure with update fields at same level as uid | Update swagger documentation to show correct flat structure: {"uid": "string", "pinned": boolean, "order": number, "name": "string"} instead of nested {"uid": "string", "updates": {...}} | critical |
| view_uid | API returns 404 'view does not exist' when invalid UIDs are provided, but doesn't specify which specific UID is invalid in bulk operations | Enhance error message to specify which view UID(s) are invalid in bulk operations | minor |
| system_view_updates | Documentation doesn't clarify that system-level views have restrictions on which fields can be updated (e.g., name cannot be changed) | Add note that system views (level='system') have limited update capabilities compared to staff views (level='staff') | major |