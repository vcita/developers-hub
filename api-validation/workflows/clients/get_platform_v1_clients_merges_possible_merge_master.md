---
endpoint: "GET /platform/v1/clients/merges/possible_merge_master"
domain: clients
tags: []
swagger: swagger/clients/legacy/legacy_v1_clients.json
status: success
savedAt: 2026-01-26T05:27:34.436Z
verifiedAt: 2026-01-26T05:27:34.436Z
---

# Get Possible merge master

## Summary
Successfully tested GET /platform/v1/clients/merges/possible_merge_master. The endpoint requires the client_ids query parameter with comma-separated client UIDs. Returns 422 if clients have multiple matters (cannot be merged) or 200 with eligible master_ids if clients can be merged.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_possible_merge_master
    method: GET
    path: "/platform/v1/clients/merges/possible_merge_master"
    expect:
      status: [200, 201]
```
