---
endpoint: "POST /v3/scheduling/resources"
domain: scheduling
tags: [scheduling, resources]
swagger: "swagger/scheduling/resource_management.json"
status: verified
savedAt: 2026-02-09T10:30:40.000Z
verifiedAt: 2026-02-09T10:30:40.000Z
timesReused: 0
tokens: [staff]
---

# Create Resource

## Summary
Creates a new scheduling resource. **Token Type**: Requires a **staff token**.

## Prerequisites
```yaml
steps:
  - id: create_resource_type
    description: "Create a resource type for the new resource"
    method: POST
    path: "/v3/scheduling/resource_types"
    token: staff
    body:
      name: "TestType{{now_timestamp}}"
    expect:
      status: 201
    extract:
      resource_type_uid: "$.data.uid"
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: create_resource
    method: POST
    path: "/v3/scheduling/resources"
    token: staff
    body:
      name: "TestResource{{now_timestamp}}"
      resource_type_uid: "{{resource_type_uid}}"
    expect:
      status: 201
```