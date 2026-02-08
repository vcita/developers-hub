---
endpoint: GET /platform/v1/services/availability
domain: sales
tags: []
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: verified
savedAt: 2026-01-26T20:15:02.242Z
verifiedAt: 2026-02-07T07:52:07.000Z
timesReused: 0
---

# Get Availability

## Summary
Test passes after adding required parameters. The endpoint requires either service_ids OR id parameter, plus start_date and end_date. Successfully resolved service IDs from GET /platform/v1/services and verified both parameter formats work.

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
    description: "Get availability for services"
    method: GET
    path: "/platform/v1/services/availability?business_id={{business_id}}&service_ids={{service_id}}&start_date={{today_date}}&end_date={{tomorrow_date}}"
    token: staff
    expect:
      status: [200]
```
