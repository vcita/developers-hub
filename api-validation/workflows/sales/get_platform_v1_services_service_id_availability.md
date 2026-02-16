---
endpoint: GET /platform/v1/services/{service_id}/availability
domain: sales
tags: []
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: verified
savedAt: 2026-02-06T19:14:27.857Z
verifiedAt: 2026-02-07T07:52:51.000Z
timesReused: 0
---
# Get Availability

## Summary

GET /platform/v1/services/{service_id}/availability works when required query params start_date and end_date are provided. Retried with start_date=2026-02-06&end_date=2026-02-07 and received 200 OK.

## Prerequisites

```yaml
steps:
  - id: get_client_id
    description: "Fetch a client ID for date variable initialization"
    method: GET
    path: "/platform/v1/clients"
    token: staff
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_id: "$.data.clients[0].id"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get availability"
    method: GET
    path: "/platform/v1/services/{{service_id}}/availability?start_date={{today_date}}&end_date={{tomorrow_date}}&include_dst=true"
    token: staff
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| required_field: start_date | Not clearly required (test did not include it). | Required; missing -> 400 PARAMETER_MISSING. | - |
| required_field: end_date | Not clearly required (test did not include it). | Required; missing -> 400 PARAMETER_MISSING. | - |
| missing_field: booking_instance_id | Not documented. | Optional param supported. | - |
| missing_field: show_past_availabilities | Not documented. | Optional param supported. | - |
| missing_field: ignore_min_schedule | Not documented. | Optional param supported. | - |
