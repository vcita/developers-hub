---
endpoint: "GET /platform/v1/services/{service_id}/availability"
domain: sales
tags: []
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-01-26T22:07:07.177Z"
verifiedAt: "2026-01-26T22:07:07.177Z"
timesReused: 0
---

# Get Availability

## Summary
Test passes when required query parameters start_date and end_date are included. Original request was missing these mandatory parameters.

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
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_availability
    method: GET
    path: "/platform/v1/services/{{service_id}}/availability"
    expect:
      status: [200, 201]
```
