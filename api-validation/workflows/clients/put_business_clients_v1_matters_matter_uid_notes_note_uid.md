---
endpoint: "PUT /business/clients/v1/matters/{matter_uid}/notes/{note_uid}"
domain: clients
tags: [matters, notes, update]
swagger: "swagger/clients/legacy/manage_clients.json"
status: verified
savedAt: "2026-01-25T22:30:00.000Z"
verifiedAt: "2026-02-04T16:00:00.000Z"
timesReused: 0
---

# Update Notes

## Summary
Update an existing note on a matter. This endpoint requires valid `matter_uid` and `note_uid` path parameters. The note must exist and belong to the specified matter.

## Prerequisites

```yaml
steps:
  - id: create_note
    description: "Create a note to update"
    method: POST
    path: "/business/clients/v1/matters/{{matter_uid}}/notes"
    body:
      note:
        content: "Note created for update test"
    extract:
      note_uid: "$.data.note.uid"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: put_notes
    method: PUT
    path: "/business/clients/v1/matters/{{matter_uid}}/notes/{{note_uid}}"
    body:
      note:
        content: Updated note content
    expect:
      status: [200, 201]
```
