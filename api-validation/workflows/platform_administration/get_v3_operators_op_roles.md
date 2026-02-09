---
endpoint: "GET /v3/operators/op_roles"
domain: platform_administration
tags: [operators]
swagger: "swagger/platform_administration/legacy/legacy_v1_businesses.json"
status: skipped
savedAt: "2026-01-28T12:01:02.685Z"
verifiedAt: "2026-01-28T12:01:02.685Z"
timesReused: 0
---

# Get Op roles

## Summary
User-approved skip: Endpoint is documented in swagger but not implemented in the codebase. The routes configuration shows only one operators endpoint under v3: '/operator_tokens', but no op_roles resource. This appears to be a documentation-only endpoint without actual implementation.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_op_roles
    method: GET
    path: "/v3/operators/op_roles"
    expect:
      status: [200, 201]
```
