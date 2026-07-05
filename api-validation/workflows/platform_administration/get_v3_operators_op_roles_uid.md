---
endpoint: "GET /v3/operators/op_roles/{uid}"
domain: platform_administration
tags: [operators]
swagger: "swagger/platform_administration/legacy/legacy_v1_businesses.json"
status: skip
savedAt: "2026-01-29T22:10:36.971Z"
verifiedAt: "2026-01-29T22:10:36.971Z"
timesReused: 0
---

# Get Op roles

## Summary
User-approved skip: Endpoint path /v3/operators/op_roles is not routed/available in this environment (404 on list and retrieve). Cannot resolve a valid op_role uid to complete the test.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_op_roles
    method: GET
    path: "/v3/operators/op_roles/{{uid}}"
    expect:
      status: [200, 201]
```
