---
endpoint: "GET /business/payments/v1/taxes/{tax_uid}"
domain: sales
tags: [taxes]
swagger: mcp_swagger/sales.json
status: success
savedAt: 2026-02-06T20:49:00.000Z
verifiedAt: 2026-02-06T20:49:00.000Z
timesReused: 0
useFallbackApi: true
---
# Get Tax

## Summary

Retrieves a single tax by its UID. The endpoint works via the fallback API with a staff token. APIGW returns 401.

**Token Type**: This endpoint requires a **Staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 401 for staff tokens.

## Prerequisites

```yaml
steps:
  - id: get_tax_list
    description: "Fetch taxes list to get a valid tax UID"
    method: GET
    path: "/business/payments/v1/taxes"
    extract:
      tax_uid: "$.data.taxes[0].id"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get a single tax by UID"
    method: GET
    path: "/business/payments/v1/taxes/{{tax_uid}}"
    expect:
      status: [200]
```
