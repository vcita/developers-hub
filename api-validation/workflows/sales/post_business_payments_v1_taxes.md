---
endpoint: "POST /business/payments/v1/taxes"
domain: sales
tags: [taxes]
swagger: "swagger/sales/legacy/payments.json"
status: success
savedAt: "2026-01-26T21:35:28.064Z"
verifiedAt: "2026-02-06T20:51:00.000Z"
timesReused: 0
useFallbackApi: true
---

# Create Tax

## Summary

Creates a tax. The `default_for_categories` field must be an array (not a string or hash). The endpoint works via the fallback API; APIGW returns 401 for staff tokens.

**Token Type**: This endpoint requires a **Staff token** (via fallback API).

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 401 for staff tokens.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_taxes
    method: POST
    path: "/business/payments/v1/taxes"
    body:
      tax:
        default_for_categories: []
        name: "API Test Tax"
        rate: 8.75
    expect:
      status: [200, 201]
```
