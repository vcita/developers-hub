---
endpoint: "PUT /v3/scheduling/resources/{uid}"
domain: scheduling
tags: [scheduling, resources]
swagger: "swagger/scheduling/resource_management.json"
status: verified
savedAt: "2026-02-09T10:17:02.500Z"
verifiedAt: "2026-02-09T10:17:02.500Z"
timesReused: 0
tokens: [staff]
---

# Update Resource

## Summary
Updates a specific resource by UID. **Token Type**: Requires a **staff token**.

## Prerequisites
```yaml
steps:
  - id: create_resource_type
    description: "Create a resource type for testing"
    method: POST
    path: "/v3/scheduling/resource_types"
    token: staff
    body:
      name: "TestType"
    expect:
      status: 201
    extract:
      resource_type_uid: "$.data.uid"
    onFail: abort

  - id: create_resource
    description: "Create a resource to get a valid UID"
    method: POST
    path: "/v3/scheduling/resources"
    token: staff
    body:
      name: "TestResource"
      resource_type_uid: "{{resource_type_uid}}"
    expect:
      status: 201
    extract:
      resource_uid: "$.data.uid"
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: update_resource
    method: PUT
    path: "/v3/scheduling/resources/{{resource_uid}}"
    token: staff
    body:
      name: "UpdatedTestResource"
    expect:
      status: 200
```