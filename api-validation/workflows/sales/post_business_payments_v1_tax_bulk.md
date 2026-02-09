---
endpoint: "POST /business/payments/v1/tax_bulk"
domain: sales
tags: [taxes]
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T14:18:35.613Z"
verifiedAt: "2026-02-06T20:51:00.000Z"
timesReused: 0
useFallbackApi: true
---

# Create Tax Bulk

## Summary

Creates taxes in bulk. The data field must be a JSON array (not a hash with numeric keys). The endpoint works via the fallback API; APIGW returns 401 for staff tokens.

**Token Type**: This endpoint requires a **Staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 401 for staff tokens.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_tax_bulk
    method: POST
    path: "/business/payments/v1/tax_bulk"
    body:
      data:
        - name: "Test Tax {{future_datetime}}"
          rate: 8.75
    expect:
      status: [200, 201]
```