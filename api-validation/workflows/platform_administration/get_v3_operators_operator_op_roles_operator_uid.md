---
endpoint: "GET /v3/operators/operator_op_roles/{operator_uid}"
domain: platform_administration
tags: [operators]
swagger: "swagger/platform_administration/legacy/legacy_v1_businesses.json"
status: skip
savedAt: "2026-01-28T12:01:15.801Z"
verifiedAt: "2026-01-28T12:01:15.801Z"
timesReused: 0
---

# Get Operator op roles

## Summary
User-approved skip: Infrastructure issue - the operator management service appears to be unavailable in this test environment. All related endpoints (/v3/operators/* and /api/operator_api/v1/*) return 404 or bad gateway errors, indicating a service routing or availability problem rather than an endpoint implementation issue.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_operator_op_roles
    method: GET
    path: "/v3/operators/operator_op_roles/{{operator_uid}}"
    expect:
      status: [200, 201]
```
