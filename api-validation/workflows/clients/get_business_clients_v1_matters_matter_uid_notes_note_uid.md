---
endpoint: "GET /business/clients/v1/matters/{matter_uid}/notes/{note_uid}"
domain: clients
tags: []
swagger: swagger/clients/legacy/manage_clients.json
status: success
savedAt: 2026-01-26T05:20:54.369Z
verifiedAt: 2026-01-26T05:20:54.369Z
---

# Get Notes

## Summary
Successfully retrieved note details. The endpoint returned HTTP 200 with complete note data including UID, content, staff_uid, and timestamps.

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
  - id: get_notes
    method: GET
    path: "/business/clients/v1/matters/{matter_uid}/notes/{note_uid}"
    expect:
      status: [200, 201]
```
