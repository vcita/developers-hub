---
endpoint: "GET /platform/v1/services/{service_uid}/availability"
domain: sales
tags: [services, availability]
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: verified
savedAt: 2026-01-27T01:32:12.398Z
verifiedAt: 2026-01-27T01:32:12.398Z
timesReused: 0
---

# Get Service Availability

## Summary
Get availability for a specific service by UID. **Token Type**: Requires a **staff token**.

## Prerequisites
```yaml
steps:
  - id: get_service_uid
    description: "Fetch a service UID to test availability"
    method: GET
    path: "/platform/v1/services"
    token: staff
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      service_uid: "$.data.services[0].id"
    expect:
      status: [200]
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: main_request
    description: "Get service availability"
    method: GET
    path: "/platform/v1/services/{{service_uid}}/availability"
    token: staff
    params:
      start_date: "{{today_date}}"
      end_date: "{{tomorrow_date}}"
    expect:
      status: [200]
```