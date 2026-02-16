---
endpoint: GET /business/clients/v1/matters/{matter_uid}/notes/{note_uid}
domain: clients
tags: []
status: success
savedAt: 2026-01-26T05:20:54.369Z
verifiedAt: 2026-01-26T05:20:54.369Z
timesReused: 0
---
# Get Notes

## Summary
Successfully retrieved note details. The endpoint returned HTTP 200 with complete note data including UID, content, staff_uid, and timestamps.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| note_uid | GET /business/clients/v1/matters/{matter_uid}/notes | data.notes[0].uid | - | - |

### Resolution Steps

**note_uid**:
1. Call `GET /business/clients/v1/matters/{matter_uid}/notes`
2. Extract from response: `data.notes[0].uid`
3. If empty, create via `POST /business/clients/v1/matters/{matter_uid}/notes`

```json
{
  "note_uid": {
    "source_endpoint": "GET /business/clients/v1/matters/{matter_uid}/notes",
    "extract_from": "data.notes[0].uid",
    "fallback_endpoint": "POST /business/clients/v1/matters/{matter_uid}/notes",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": {
      "content": "Test note {{timestamp}}"
    },
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
  "path": "/business/clients/v1/matters/{{resolved.uid}}/notes/{{resolved.uid}}"
}
```