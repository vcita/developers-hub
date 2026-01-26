---
endpoint: POST /business/search/v1/views/bulk
domain: clients
tags: []
status: success
savedAt: 2026-01-26T05:12:03.933Z
verifiedAt: 2026-01-26T05:12:03.933Z
timesReused: 0
---
# Create Bulk

## Summary
Test passes successfully. The original request used placeholder UIDs that don't exist. When using valid view UIDs from existing views, the bulk update endpoint works correctly and returns HTTP 201 with updated view data.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| view_uids | GET /business/search/v1/views | data.data[0].uid and data.data[1].uid | - | DELETE /business/search/v1/views/{uid} |

### Resolution Steps

**view_uids**:
1. **Create fresh test entity**: `POST /business/search/v1/views`
   - Body template: `{"name":"Test View {{timestamp}}","description":"Test Description","columns":[{"label":"Contact Full Name","type":"ContactFullName","identifier":"contact_full_name"}],"filter":"{}","level":"staff"}`
2. Extract UID from creation response: `data.data[0].uid and data.data[1].uid`
3. Run the test with this fresh UID
4. **Cleanup**: `DELETE /business/search/v1/views/{uid}`

```json
{
  "view_uids": {
    "source_endpoint": "GET /business/search/v1/views",
    "extract_from": "data.data[0].uid and data.data[1].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": "POST /business/search/v1/views",
    "create_body": {
      "name": "Test View {{timestamp}}",
      "description": "Test Description",
      "columns": [
        {
          "label": "Contact Full Name",
          "type": "ContactFullName",
          "identifier": "contact_full_name"
        }
      ],
      "filter": "{}",
      "level": "staff"
    },
    "cleanup_endpoint": "DELETE /business/search/v1/views/{uid}",
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
  "method": "POST",
  "path": "/business/search/v1/views/bulk",
  "body": {
    "views": [
      {
        "uid": "{{resolved.uid}}",
        "pinned": true,
        "order": 1
      },
      {
        "uid": "{{resolved.uid}}",
        "pinned": false,
        "order": 2,
        "name": "Updated Name"
      }
    ]
  }
}
```