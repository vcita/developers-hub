---
endpoint: "GET /v3/sales/reports/payments_widget"
domain: sales
tags: [reports, widget]
swagger: mcp_swagger/sales.json
status: success
savedAt: 2026-02-06T20:49:00.000Z
verifiedAt: 2026-02-06T20:49:00.000Z
timesReused: 0
---
# Get Payments Widget Report

## Summary

Returns a payments widget report with total_payments, overdue_payments_summary, and pending_estimates sections. Each section contains nested success and data fields. The endpoint works via the fallback API; APIGW returns 404.

**Token Type**: This endpoint requires a **Staff token**.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get payments widget report"
    method: GET
    path: "/v3/sales/reports/payments_widget"
    expect:
      status: [200]
```
