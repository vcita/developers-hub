---
endpoint: "GET /business/payments/v1/taxes"
domain: sales
tags: [taxes]
swagger: mcp_swagger/sales.json
status: success
savedAt: 2026-02-06T20:49:00.000Z
verifiedAt: 2026-02-06T20:49:00.000Z
timesReused: 0
useFallbackApi: true
---
# List Taxes

## Summary

Lists all taxes configured for the business. The endpoint works via the fallback API with a staff token. APIGW returns 401.

**Token Type**: This endpoint requires a **Staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 401 for staff tokens.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "List all taxes for the business"
    method: GET
    path: "/business/payments/v1/taxes"
    expect:
      status: [200]
```
