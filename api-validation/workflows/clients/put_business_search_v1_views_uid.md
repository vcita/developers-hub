---
endpoint: PUT /business/search/v1/views/{uid}
domain: clients
tags: []
status: success
savedAt: 2026-01-25T21:03:23.031Z
verifiedAt: 2026-01-25T21:03:23.031Z
timesReused: 0
---
# Update Views

## Summary
Successfully updated a view by removing the 'level' field from the request body. The 'level' field appears to be immutable after creation and should only be used in CREATE operations, not UPDATE operations.

## Prerequisites
No specific prerequisites documented.

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
      "name": "Updated Test View",
      "columns": [
        {
          "label": "Contact Full Name",
          "type": "ContactFullName",
          "identifier": "contact_full_name",
          "sortable": true,
          "sort_options": {}
        }
      ],
      "filter": "{}",
      "description": "Updated description",
      "pinned": false,
      "sorting_column": "contact_full_name",
      "sorting_direction": "asc"
    }
  }
}
```