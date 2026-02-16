---
endpoint: "POST /v3/operators/operator_op_roles"
domain: platform_administration
tags: [operators]
swagger: "swagger/platform_administration/legacy/legacy_v1_businesses.json"
status: skip
savedAt: "2026-01-28T09:50:27.436Z"
verifiedAt: "2026-01-28T09:50:27.436Z"
timesReused: 0
---

# Create Operator op roles

## Summary
User-approved skip: The endpoint POST /v3/operators/operator_op_roles is documented in swagger but not implemented in the backend. Routes configuration in core/config/routes.rb shows v3 operators namespace only contains operator_tokens endpoint. The OperatorRole model exists, but the REST API endpoints for managing operator role assignments are missing from the routing table.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_operator_op_roles
    method: POST
    path: "/v3/operators/operator_op_roles"
    expect:
      status: [200, 201]
```
