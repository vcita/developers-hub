---
endpoint: PUT /business/search/v1/views/{uid}
domain: clients
tags: []
status: success
savedAt: 2026-01-26T05:32:22.049Z
verifiedAt: 2026-01-26T05:32:22.049Z
timesReused: 0
---
# Update Views

## Summary
Successfully updated view after correcting level value from "business" to "account" and providing proper JSON format for filter field

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | Already resolved in config | config.params.data_uid | - | Views are business data - no cleanup needed |

### Resolution Steps

**uid**:
1. Call `Already resolved in config`
2. Extract from response: `config.params.data_uid`

```json
{
  "uid": {
    "source_endpoint": "Already resolved in config",
    "extract_from": "config.params.data_uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Views are business data - no cleanup needed"
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
  "method": "PUT",
  "path": "/business/search/v1/views/{{resolved.uid}}",
  "body": {
    "view": {
      "level": "account",
      "name": "Updated Test View",
      "columns": [
        {
          "label": "Contact Name",
          "type": "ContactFullName",
          "identifier": "contact_full_name",
          "sortable": true,
          "sort_options": {}
        },
        {
          "label": "Tags",
          "type": "Tags",
          "identifier": "tags",
          "sortable": false,
          "sort_options": {}
        }
      ],
      "filter": "{}"
    }
  }
}
```