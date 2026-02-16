---
endpoint: "POST /business/clients/v1/matters/{matter_uid}/notes"
domain: clients
tags: []
swagger: "swagger/clients/legacy/manage_clients.json"
status: pending
savedAt: "2026-02-03T18:27:27.712Z"
timesReused: 0
---

# Create Note

## Summary
Creates a note on a matter. Requires a valid matter_uid and note content.

## Prerequisites

```yaml
steps:
  - id: get_matters
    description: "Get a matter to add note to"
    method: GET
    path: "/business/clients/v1/matters"
    extract:
      matter_uid: "$.data.matters[0].uid"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_notes
    method: POST
    path: "/business/clients/v1/matters/{{matter_uid}}"
    body:
      note:
        content: "Test note content created by API validation"
    expect:
      status: [200, 201]
```
