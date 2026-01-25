---
endpoint: GET /business/clients/v1/matters/{matter_uid}/notes/{note_uid}
domain: clients
tags: []
status: success
savedAt: 2026-01-25T20:50:25.870Z
verifiedAt: 2026-01-25T20:50:25.870Z
timesReused: 0
---
# Get Notes

## Summary
Successfully retrieved note details. The endpoint requires both matter_uid and note_uid path parameters and returns note information with 200 status.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| note_uid | GET /business/clients/v1/matters/{matter_uid}/notes | data.notes[0].uid | - | DELETE /business/clients/v1/matters/{matter_uid}/notes/{note_uid} |

### Resolution Steps

**note_uid**:
1. **Create fresh test entity**: `POST /business/clients/v1/matters/{matter_uid}/notes`
   - Body template: `{"content":"Test note content {{timestamp}}"}`
2. Extract UID from creation response: `data.notes[0].uid`
3. Run the test with this fresh UID
4. **Cleanup**: `DELETE /business/clients/v1/matters/{matter_uid}/notes/{note_uid}`

```json
{
  "note_uid": {
    "source_endpoint": "GET /business/clients/v1/matters/{matter_uid}/notes",
    "extract_from": "data.notes[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": "POST /business/clients/v1/matters/{matter_uid}/notes",
    "create_body": {
      "content": "Test note content {{timestamp}}"
    },
    "cleanup_endpoint": "DELETE /business/clients/v1/matters/{matter_uid}/notes/{note_uid}",
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