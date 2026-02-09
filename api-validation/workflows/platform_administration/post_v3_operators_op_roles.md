---
endpoint: "POST /v3/operators/op_roles"
domain: platform_administration
tags: [operators]
swagger: "swagger/platform_administration/legacy/legacy_v1_businesses.json"
status: skipped
savedAt: "2026-01-28T09:49:57.615Z"
verifiedAt: "2026-01-28T09:49:57.615Z"
timesReused: 0
---

# Create Op roles

## Summary
User-approved skip: This endpoint appears to be documented in swagger but not actually implemented. Returns 404 with all token types (admin, operator), and no implementation found in core or permissionsmanager repositories. Related operator endpoints also return 404.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_op_roles
    method: POST
    path: "/v3/operators/op_roles"
    expect:
      status: [200, 201]
```
