---
endpoint: "GET /v3/integrations/import_job_items/{uid}"
domain: integrations
tags: [integrations]
status: skip
savedAt: 2026-03-01T19:54:01.526Z
verifiedAt: 2026-03-01T19:54:01.526Z
timesReused: 0
skipReason: "Manual skip - endpoint not ready for testing"
---
# Get Import job items

## Summary

User-approved skip: Manual skip - endpoint not ready for testing

## Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Manual skip - endpoint not ready for testing

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get import_job_items"
    method: GET
    path: "/v3/integrations/import_job_items/{uid}"
    expect:
      status: [200, 201]
```