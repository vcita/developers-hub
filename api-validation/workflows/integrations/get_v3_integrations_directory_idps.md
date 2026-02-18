---
endpoint: "GET /v3/integrations/directory_idps"
domain: integrations
tags: [integrations, directory, idp]
swagger: swagger/integrations/authbridge.json
status: pending
savedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
---

# List Directory IDPs

## Summary
Retrieves directory Identity Providers. **Token Type**: Requires a **directory token**.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/integrations/directory_idps"
    expect:
      status: 200
```