---
endpoint: "GET /platform/v1/payment/packages"
domain: sales
tags: [packages]
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: pending
savedAt: 2026-02-06T20:49:00.000Z
verifiedAt: 2026-02-07T07:06:20.000Z
timesReused: 0
useFallbackApi: true
tokens: [directory]
---
# List Packages

## Summary

Lists all payment packages for a business. Requires a **directory token** with `X-On-Behalf-Of` header. Staff tokens return 422 Unauthorized.

**Token Type**: This endpoint requires a **Directory token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.

## Authentication

| Token Type | Works | Notes |
|------------|-------|-------|
| Staff | ❌ | Returns 422 Unauthorized |
| Directory | ✅ | Requires X-On-Behalf-Of header |

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "List all payment packages for the business"
    method: GET
    path: "/platform/v1/payment/packages?business_id={{business_id}}"
    token: directory
    expect:
      status: [200]
```
