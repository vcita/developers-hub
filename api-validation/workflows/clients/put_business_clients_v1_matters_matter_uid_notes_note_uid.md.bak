---
endpoint: PUT /business/clients/v1/matters/{matter_uid}/notes/{note_uid}
domain: clients
tags: [matters, notes, update]
status: success
savedAt: 2026-01-25T22:30:00.000Z
verifiedAt: 2026-01-25T22:30:00.000Z
timesReused: 0
---
# Update Matter Note

## Summary
Update an existing note on a matter. This endpoint requires valid `matter_uid` and `note_uid` path parameters. The note must exist and belong to the specified matter.

## Authentication
**Available for Staff, App, and Directory Tokens.**

## Prerequisites
1. A valid matter must exist (get one via `GET /business/clients/v1/matters` or create via matter creation flow)
2. A note must exist on that matter (create one via `POST /business/clients/v1/matters/{matter_uid}/notes`)
3. The `{note_uid}` path parameter uses the note's `uid` field from the creation response

## UID Resolution Procedure

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| matter_uid | GET /business/clients/v1/matters | data.matters[0].uid | Via contact/matter creation flow | None needed |
| note_uid | POST /business/clients/v1/matters/{matter_uid}/notes | data.note.uid | ✓ POST /business/clients/v1/matters/{matter_uid}/notes | DELETE /business/clients/v1/matters/{matter_uid}/notes/{note_uid} |

### Resolution Steps

**matter_uid**:
1. **Get existing**: `GET /business/clients/v1/matters?per_page=1`
2. Extract UID from response: `data.matters[0].uid`
3. If no matters exist, create one via the contact/matter creation flow

**note_uid**:
1. **Create fresh test entity**: `POST /business/clients/v1/matters/{matter_uid}/notes`
   - Body template: `{"note": {"content": "Test note content for update test"}}`
2. Extract UID from creation response: `data.note.uid`
3. Run the test with this fresh UID
4. **Cleanup**: `DELETE /business/clients/v1/matters/{matter_uid}/notes/{note_uid}`

## UID Resolution JSON

```json
{
  "matter_uid": {
    "source_endpoint": "GET /business/clients/v1/matters",
    "extract_from": "data.matters[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "cleanup_endpoint": null,
    "cleanup_note": "Reuse existing matters"
  },
  "note_uid": {
    "source_endpoint": "POST /business/clients/v1/matters/{matter_uid}/notes",
    "extract_from": "data.note.uid",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": "POST /business/clients/v1/matters/{matter_uid}/notes",
    "create_body": {
      "note": {
        "content": "Test note content for update test"
      }
    },
    "cleanup_endpoint": "DELETE /business/clients/v1/matters/{matter_uid}/notes/{note_uid}",
    "cleanup_note": "Delete the test note after testing"
  }
}
```

## Critical Learnings

1. **404 does NOT mean routing issue**: A 404 response means the matter or note was not found, not that the endpoint is inaccessible. The endpoint routing is correct.
2. **Parameter name**: The Rails route uses `param: :uid` for notes, but the swagger documents it as `{note_uid}`. Both work - the value is passed regardless of the name.
3. **Dependency chain**: note_uid depends on matter_uid - you must resolve matter_uid first.
4. **Create before update**: You cannot update a non-existent note. Always create a note first if testing the update endpoint.

## Request Template

```json
{
  "method": "PUT",
  "path": "/business/clients/v1/matters/{matter_uid}/notes/{note_uid}",
  "token_type": "staff",
  "body": {
    "note": {
      "content": "Updated note content"
    }
  }
}
```

## Expected Response

```json
{
  "success": true,
  "data": {
    "note": {
      "uid": "note_uid_here",
      "content": "Updated note content",
      "staff_uid": "staff_uid_here",
      "created_at": "2026-01-25T10:00:00.000Z",
      "updated_at": "2026-01-25T10:30:00.000Z"
    }
  }
}
```
