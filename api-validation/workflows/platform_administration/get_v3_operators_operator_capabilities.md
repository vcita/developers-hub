---
endpoint: "GET /v3/operators/operator_capabilities"
domain: platform_administration
tags: [operators]
swagger: "swagger/platform_administration/legacy/legacy_v1_businesses.json"
status: skip
savedAt: "2026-01-28T12:01:10.846Z"
verifiedAt: "2026-01-28T12:01:10.846Z"
timesReused: 0
---

# Get Operator capabilities

## Summary
User-approved skip: Endpoint not implemented - returns 404 with all token types and no implementation found in source code

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_operator_capabilities
    method: GET
    path: "/v3/operators/operator_capabilities"
    expect:
      status: [200, 201]
```
