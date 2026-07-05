---
endpoint: "GET /v3/scheduling/resource_types"
domain: scheduling
tags: [scheduling, resource_types]
swagger: "swagger/scheduling/resource_types.json"
status: verified
savedAt: "2026-02-09T11:58:12.398Z"
verifiedAt: "2026-02-09T11:58:12.398Z"
timesReused: 0
tokens: [staff]
---

# Get Resource Types

## Summary
Retrieves a list of resource types. **Token Type**: Requires a **staff token**.

## Test Request
```yaml
steps:
  - id: get_resource_types
    method: GET
    path: "/v3/scheduling/resource_types"
    token: staff
    expect:
      status: 200
```