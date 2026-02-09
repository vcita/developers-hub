---
endpoint: "GET /business/clients/v1/matters/{matter_uid}/notes/{note_uid}"
domain: clients
tags: []
swagger: "swagger/clients/legacy/manage_clients.json"
status: verified
savedAt: "2026-01-26T05:20:54.369Z"
verifiedAt: "2026-02-04T15:46:54.000Z"
timesReused: 0
---

# Get Notes

## Summary
Successfully retrieved note details. The endpoint returned HTTP 200 with complete note data including UID, content, staff_uid, and timestamps.

## Prerequisites

```yaml
steps:
  - id: create_note
    description: "Create a note for the matter to ensure test data exists"
    method: POST
    path: "/business/clients/v1/matters/{{matter_uid}}/notes"
    body:
      note:
        content: "Test note created for API validation"
    extract:
      note_uid: "$.data.note.uid"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_notes
    description: "Get a specific note by UID"
    method: GET
    path: "/business/clients/v1/matters/{{matter_uid}}/notes/{{note_uid}}"
    expect:
      status: [200, 201]
```
