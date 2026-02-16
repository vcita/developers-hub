---
endpoint: "PUT /business/payments/v1/taxes/{tax_uid}"
domain: sales
tags: [taxes]
swagger: swagger/sales/legacy/payments.json
status: pending
savedAt: 2026-02-06T20:49:00.000Z
verifiedAt: 2026-02-07T07:27:22.000Z
timesReused: 0
useFallbackApi: true
---
# Update Tax

## Summary

Updates a tax by its UID. The endpoint works via the fallback API with a staff token. APIGW returns 401 because it requires OAuth Bearer token with scope business/payments.

**Token Type**: This endpoint requires a **Staff token** (via fallback API).

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway requires OAuth token not available in test env.

## Prerequisites

```yaml
steps:
  - id: get_taxes
    description: "Fetch taxes to get a valid tax UID"
    method: GET
    path: "/business/payments/v1/taxes"
    token: staff
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
    description: "Update a tax"
    method: PUT
    path: "/business/payments/v1/taxes/{{tax_uid}}"
    body:
      tax:
        name: "API Test Tax {{now_timestamp}}"
        rate: 8.78
        default_for_categories: ["packages"]
    expect:
      status: [200]
```
