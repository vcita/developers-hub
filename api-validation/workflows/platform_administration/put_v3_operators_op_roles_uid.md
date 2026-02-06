---
endpoint: "PUT /v3/operators/op_roles/{uid}"
domain: platform_administration
tags: [operators]
swagger: "swagger/platform_administration/legacy/legacy_v1_businesses.json"
status: skipped
savedAt: "2026-01-28T20:24:13.804Z"
verifiedAt: "2026-01-28T20:24:13.804Z"
timesReused: 0
---

# Update Op roles

## Summary
User-approved skip: The entire /v3/operators/* endpoint namespace appears to be missing from the actual API implementation, despite being documented in swagger. This is an infrastructure/implementation issue rather than a test data problem.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_op_roles
    method: PUT
    path: "/v3/operators/op_roles/{{uid}}"
    expect:
      status: [200, 201]
```
