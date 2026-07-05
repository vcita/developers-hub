---
endpoint: "PUT /v3/scheduling/resource_types/{uid}"
domain: scheduling
tags: [scheduling, resource_types]
swagger: "swagger/scheduling/resource_types.json"
status: verified
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
tokens: [staff]
---

# Update Resource Type

## Summary
Updates a specific resource type by UID. **Token Type**: Requires a **staff token**.

## Prerequisites
```yaml
steps:
  - id: get_resource_types_list
    description: "Fetch resource types to get a valid UID"
    method: GET
    path: "/v3/scheduling/resource_types"
    token: staff
    expect:
      status: 200
    extract:
      uid: "$.data.resource_types[0].uid"
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: update_resource_type
    method: PUT
    path: "/v3/scheduling/resource_types/{{uid}}"
    token: staff
    body:
      name: "Updated Type"
    expect:
      status: 200
```