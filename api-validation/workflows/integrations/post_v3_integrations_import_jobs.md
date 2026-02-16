---
endpoint: "POST /v3/integrations/import_jobs"
domain: integrations
tags: [integrations, import]
swagger: swagger/integrations/import.json
status: pending
savedAt: 2026-01-26T21:28:12.398Z
expectedOutcome: 400
expectedOutcomeReason: "File upload endpoint requiring multipart/form-data with actual file attachment - cannot be tested with JSON body"
---

# Create Import Job

## Summary
Creates a new import job for importing data (products) into a business account. **Token Type**: Requires a **staff token**.

> ⚠️ **File Upload Required**: This endpoint requires `multipart/form-data` with an actual file attachment for Excel provider type, or a valid source import job UID for import_job provider type. JSON-only testing returns 400 "File must be provided" or 500 errors due to missing/invalid file data.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    method: POST
    path: "/v3/integrations/import_jobs"
    body:
      entity_type: "product"
      provider_type: "excel"
      job_type: "validate"
    expect:
      status: 400
```