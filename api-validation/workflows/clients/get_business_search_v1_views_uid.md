---
endpoint: "GET /business/search/v1/views/{uid}"
domain: clients
tags: []
swagger: swagger/clients/legacy/crm_views.json
status: success
savedAt: 2026-01-26T05:28:17.806Z
verifiedAt: 2026-01-26T05:28:17.806Z
---

# Get Search

## Summary
Successfully retrieved a specific view by UID. The original failure was due to using a non-existent view UID. Using a valid UID (n0r6yxumbcp7bstu) from GET /business/search/v1/views returned the expected view details.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_views
    method: GET
    path: "/business/search/v1/views/{uid}"
    expect:
      status: [200, 201]
```
