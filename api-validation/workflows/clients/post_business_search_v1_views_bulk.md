---
endpoint: POST /business/search/v1/views/bulk
domain: clients
tags: []
status: success
savedAt: 2026-02-02T20:21:25.094Z
verifiedAt: 2026-02-02T20:21:25.094Z
timesReused: 0
---
# Create Bulk

## Summary
Endpoint works correctly. Successfully performed bulk updates on views with minimal (uid only) and full update payloads. Returns 201 with updated view data.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| views[].uid | GET /business/search/v1/views | data[0].uid | - | Views can be deleted via DELETE /business/search/v1/views/{uid} |

### Resolution Steps

**views[].uid**:
1. **Create fresh test entity**: `POST /business/search/v1/views`
   - Body template: `{"view":{"name":"Test View {{timestamp}}","description":"Test description","columns":[{"label":"Client Name","type":"text","identifier":"client_name","sortable":true}],"level":"account"}}`
2. Extract UID from creation response: `data[0].uid`
3. Run the test with this fresh UID
4. **Cleanup note**: Views can be deleted via DELETE /business/search/v1/views/{uid}

```json
{
  "views[].uid": {
    "source_endpoint": "GET /business/search/v1/views",
    "extract_from": "data[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": "POST /business/search/v1/views",
    "create_body": {
      "view": {
        "name": "Test View {{timestamp}}",
        "description": "Test description",
        "columns": [
          {
            "label": "Client Name",
            "type": "text",
            "identifier": "client_name",
            "sortable": true
          }
        ],
        "level": "account"
      }
    },
    "cleanup_endpoint": null,
    "cleanup_note": "Views can be deleted via DELETE /business/search/v1/views/{uid}"
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
        "name": "Updated Client View",
        "order": 5
      }
    ]
  }
}
```