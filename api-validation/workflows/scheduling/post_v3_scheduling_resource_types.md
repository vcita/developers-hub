---
endpoint: "POST /v3/scheduling/resource_types"
domain: scheduling
tags: [scheduling, resource_types]
swagger: "swagger/scheduling/resource_management.json"
status: verified
savedAt: 2026-02-09T10:29:01.000Z
verifiedAt: 2026-02-09T10:29:01.000Z
timesReused: 0
tokens: [staff]
---

# Create Resource Type

## Summary
Creates a new resource type. **Token Type**: Requires a **staff token**.

## Test Request
```yaml
steps:
  - id: create_resource_type
    method: POST
    path: "/v3/scheduling/resource_types"
    token: staff
    body:
      name: "TestType"
    expect:
      status: 201
```