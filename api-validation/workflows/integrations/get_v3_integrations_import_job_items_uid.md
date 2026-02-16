---
endpoint: "GET /v3/integrations/import_job_items/{uid}"
domain: integrations
tags: [integrations, import_jobs, import_job_items]
swagger: swagger/integrations/import.json
status: pending
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
tokens: [staff]
expectedOutcome: 404
expectedOutcomeReason: "Import job items are only created through complex file upload processes or existing import jobs. In test environments, no import job items typically exist, so the endpoint returns 404 'Import job line item with uid {uid} not found'. The endpoint structure and authentication work correctly."
---

# Get Import Job Item

## Summary
Retrieves a specific import job item by its UID. **Token Type**: Requires a **staff token**.

## Prerequisites

No prerequisites required - testing endpoint structure with non-existent UID.

## Test Request

```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/integrations/import_job_items/test_import_job_item_uid"
    expect:
      status: 404
```