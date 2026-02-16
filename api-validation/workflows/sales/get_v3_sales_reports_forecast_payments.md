---
endpoint: "GET /v3/sales/reports/forecast_payments"
domain: sales
tags: [reports, forecast]
swagger: mcp_swagger/sales.json
status: success
savedAt: 2026-02-06T20:49:00.000Z
verifiedAt: 2026-02-06T20:49:00.000Z
timesReused: 0
useFallbackApi: true
---
# Get Forecast Payments Report

## Summary

Returns a forecast payments report with weekly breakdowns by date. Response keys are dynamic date strings in YYYY-MM-DD format. Each entry contains total_amount, calendar_week, and week_end_date. The endpoint works via the fallback API; APIGW returns 404.

**Token Type**: This endpoint requires a **Staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 404 for this endpoint.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get forecast payments report"
    method: GET
    path: "/v3/sales/reports/forecast_payments"
    expect:
      status: [200]
```
