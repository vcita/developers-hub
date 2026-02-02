---
endpoint: "POST /v3/operators/operator_capabilities"
domain: platform_administration
tags: [operators]
status: skip
savedAt: 2026-01-28T09:50:22.972Z
verifiedAt: 2026-01-28T09:50:22.972Z
---

# Create Operator capabilities

## Summary
User-approved skip: This endpoint appears to be documented in swagger but not actually implemented in the codebase. The routes.rb shows 'namespace :operators, only: []' which prevents resources from being created. Additionally, the swagger specifies 'unique_code' field but the actual database model uses 'scope' and 'name' fields.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_operator_capabilities
    method: POST
    path: "/v3/operators/operator_capabilities"
    expect:
      status: [200, 201]
```
