---
endpoint: "GET /business/search/v1/views"
domain: clients
tags: [views, crm]
swagger: "swagger/clients/legacy/crm_views.json"
status: pending
savedAt: "2026-02-03T23:00:00.000Z"
verifiedAt: "2026-02-03T23:00:00.000Z"
timesReused: 0
useFallbackApi: true
---

# List Views

## Summary

Retrieves all views for the authenticated business. This endpoint requires the fallback API URL (/api2) as the primary gateway (/apigw) returns Bad Gateway.

**Token Type**: This endpoint requires a **Staff token**.

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Views retrieved |
| 401 | Unauthorized - Invalid or missing token |

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_views
    description: "List all views for the business"
    method: GET
    path: "/business/search/v1/views"
    expect:
      status: [200]
```

## Notes

- Uses fallback API URL (/api2) due to gateway routing
- Returns views at business, staff, and account levels
