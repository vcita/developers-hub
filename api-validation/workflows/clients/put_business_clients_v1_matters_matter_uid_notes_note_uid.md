---
endpoint: "PUT /business/clients/v1/matters/{matter_uid}/notes/{note_uid}"
domain: clients
tags: [matters, notes, update]
swagger: swagger/clients/legacy/manage_clients.json
status: success
savedAt: 2026-01-25T22:30:00.000Z
verifiedAt: 2026-01-25T22:30:00.000Z
---

# Update Notes

## Summary
Update an existing note on a matter. This endpoint requires valid `matter_uid` and `note_uid` path parameters. The note must exist and belong to the specified matter.

## Prerequisites

```yaml
steps:
  - id: get_matters
    description: "Fetch available matters"
    method: GET
    path: "/platform/v1/matters"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      matter_uid: "$.data.matters[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: put_notes
    method: PUT
    path: "/business/clients/v1/matters/{matter_uid}/notes/{note_uid}"
    body:
      note:
        content: Updated note content
    expect:
      status: [200, 201]
```
