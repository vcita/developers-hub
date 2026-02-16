---
endpoint: GET /v2/coupons
domain: sales
tags: [coupons]
swagger: swagger/sales/legacy/coupons.json
status: verified
savedAt: 2026-02-08T20:00:00.000Z
verifiedAt: 2026-02-08T19:53:21.000Z
timesReused: 0
useFallbackApi: true
tokens: [staff]
---

# List Coupons

## Summary

Retrieves a list of coupons for the business. Supports filtering by status using the `by_status` query parameter (comma-separated). Available for **Staff tokens**.

**Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required: This endpoint requires the fallback API to function properly. The main API gateway does not route `/v2/coupons` correctly (returns 404).

## Prerequisites

None required for this endpoint.

```yaml
steps: []
```

## Test Request

```yaml
steps:
  - id: main_request
    method: GET
    path: "/v2/coupons"
    params:
      by_status: "active"
      page: 1
      per_page: 25
    expect:
      status: [200]
```
