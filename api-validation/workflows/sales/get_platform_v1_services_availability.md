---
endpoint: "GET /platform/v1/services/availability"
domain: sales
tags: []
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: success
savedAt: 2026-01-26T20:15:02.242Z
verifiedAt: 2026-01-26T20:15:02.242Z
---

# Get Availability

## Summary
Test passes after adding required parameters. The endpoint requires either service_ids OR id parameter, plus start_date and end_date. Successfully resolved service IDs from GET /platform/v1/services and verified both parameter formats work.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_availability
    method: GET
    path: "/platform/v1/services/availability"
    expect:
      status: [200, 201]
```
