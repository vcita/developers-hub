---
endpoint: "GET /business/search/v1/view_filters"
domain: clients
tags: [views, crm, filters]
swagger: "swagger/clients/legacy/crm_views.json"
status: pending
savedAt: "2026-02-03T23:00:00.000Z"
verifiedAt: "2026-02-03T23:00:00.000Z"
timesReused: 0
useFallbackApi: true
---

# List View Filters

## Summary

Retrieves available filter definitions that can be used when creating or updating views. This endpoint requires the fallback API URL (/api2) as the primary gateway (/apigw) returns Bad Gateway.

**Token Type**: This endpoint requires a **Staff token**.

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Filters retrieved |
| 401 | Unauthorized - Invalid or missing token |

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_view_filters
    description: "List available view filter definitions"
    method: GET
    path: "/business/search/v1/view_filters"
    expect:
      status: [200]
```

## Notes

- Uses fallback API URL (/api2) due to gateway routing
- Returns filter definitions that can be applied to views
