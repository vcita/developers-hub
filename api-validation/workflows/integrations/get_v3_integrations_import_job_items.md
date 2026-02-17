---
endpoint: "GET /v3/integrations/import_job_items"
domain: integrations
tags: [integrations, import_jobs]
swagger: swagger/integrations/integrations.json
status: verified
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
tokens: [directory, staff]
---

# List Import Job Items

## Summary
Retrieves all import job items for the directory. **Token Type**: Requires a **directory token**.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/integrations/import_job_items"
    expect:
      status: 200
```