---
endpoint: "GET /platform/v1/services/{service_id}"
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:06:48.694Z
verifiedAt: 2026-01-26T22:06:48.694Z
---

# Get Services

## Summary
Test passes. Service details endpoint works correctly when provided with a valid service_id from GET /platform/v1/services.

## Prerequisites

```yaml
steps:
  - id: get_services
    description: "Fetch available services"
    method: GET
    path: "/platform/v1/services"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      service_id: "$.data.services[0].id"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_services
    method: GET
    path: "/platform/v1/services/{service_id}"
    expect:
      status: [200, 201]
```
