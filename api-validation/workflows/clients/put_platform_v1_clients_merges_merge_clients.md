---
endpoint: "PUT /platform/v1/clients/merges/merge_clients"
domain: clients
tags: [clients, merges]
swagger: swagger/clients/legacy/legacy_v1_clients.json
status: success
savedAt: 2026-01-26T05:34:29.823Z
verifiedAt: 2026-01-26T05:34:29.823Z
---

# Update Merge clients

## Summary
Merges two or more duplicate clients into one primary client. This endpoint requires query parameters `to_client_uid` and `from_client_uids` with valid, mergeable client UIDs.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_merge_clients
    method: PUT
    path: "/platform/v1/clients/merges/merge_clients"
    expect:
      status: [200, 201]
```
