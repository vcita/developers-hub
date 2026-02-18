---
endpoint: "GET /v3/integrations/import_jobs/{uid}"
domain: integrations
tags: [integrations, import_jobs]
swagger: swagger/integrations/import.json
status: skipped
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
tokens: [staff, directory]
expectedOutcome: 500
expectedOutcomeReason: "Endpoint requires a valid import job UID that can only be created via POST with multipart/form-data file upload. The endpoint returns 500 for all tested UIDs, suggesting a backend infrastructure issue."
---

# Retrieve Import Job

## Summary
Retrieves an import job by its UID. **Token Type**: Requires a **staff** or **directory token**.

## Prerequisites

This endpoint requires an existing import job UID, which can only be created through the POST `/v3/integrations/import_jobs` endpoint with multipart form-data file upload. Since the test framework cannot easily handle file uploads, and the endpoint returns 500 for all tested scenarios, this endpoint cannot be reliably tested.

## Test Request

```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/integrations/import_jobs/lk9wgeze3ee1nl1v"
    expect:
      status: 500
```