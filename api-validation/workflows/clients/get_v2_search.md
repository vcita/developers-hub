---
endpoint: GET /v2/search
domain: clients
tags: [search]
swagger: swagger/clients/search.json
status: verified
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
tokens: [staff]
---

# Search Business Data

## Summary

Searches across business data entities including clients, conversations, bookings, appointments, estimates, payments, and documents. Returns search results with top_hits grouped by entity type and counts per entity type. **Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required: This endpoint requires the fallback API to function properly. The main API gateway does not route `/v2/search` correctly.

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
    path: "/v2/search"
    params:
      query: "test"
      per_page: 5
    expect:
      status: [200]
```
