---
endpoint: "GET /v3/scheduling/resources"
domain: scheduling
tags: [scheduling, resources]
swagger: "swagger/scheduling/resource_management.json"
status: verified
savedAt: "2026-02-09T10:30:00.000Z"
verifiedAt: "2026-02-09T10:30:00.000Z"
timesReused: 0
tokens: [staff]
---

# Get Resources

## Summary
Retrieves a list of scheduling resources with pagination and filtering options. **Token Type**: Requires a **staff token**.

## Test Request
```yaml
steps:
  - id: get_resources
    method: GET
    path: "/v3/scheduling/resources"
    token: staff
    expect:
      status: 200
```