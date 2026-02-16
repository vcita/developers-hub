---
endpoint: "PUT /business/payments/v1/taxes/{tax_id}"
domain: sales
tags: [taxes]
swagger: "swagger/sales/legacy/payments.json"
status: success
savedAt: "2026-01-26T22:39:39.810Z"
verifiedAt: "2026-02-06T20:52:00.000Z"
timesReused: 0
useFallbackApi: true
---

# Update Tax

## Summary

Updates a tax by its ID. The `default_for_categories` field must be an array. The endpoint works via the fallback API; APIGW returns 401.

**Token Type**: This endpoint requires a **Staff token** (via fallback API).

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 401 for staff tokens.

## Prerequisites

```yaml
steps:
  - id: get_taxes
    description: "Fetch taxes to get a valid tax ID"
    method: GET
    path: "/business/payments/v1/taxes"
    extract:
      tax_id: "$.data.taxes[0].id"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: put_taxes
    method: PUT
    path: "/business/payments/v1/taxes/{{tax_id}}"
    body:
      tax:
        default_for_categories: ["packages"]
        name: "Sales Tax"
        rate: 8.5
    expect:
      status: [200]
```
