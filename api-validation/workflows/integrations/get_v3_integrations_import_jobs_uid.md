---
endpoint: "GET /v3/integrations/import_jobs/{uid}"
domain: integrations
tags: [integrations, import_jobs]
swagger: swagger/integrations/import.json
status: pending
savedAt: 2026-01-27T10:30:00.000Z
timesReused: 0
tokens: [staff, directory]
---

# Retrieve Import Job

## Summary
Retrieve an import job by its UID. **Token Type**: Requires a **staff token**.

## Prerequisites
```yaml
steps:
  - id: create_import_job
    description: "Create a sample import job to get UID"
    method: POST
    path: "/v3/integrations/import_jobs"
    token: staff
    body:
      entity_type: "products"
      provider_type: "import_job"
      job_type: "validate"
      provider_data:
        source_import_job_uid: "sample_job"
    extract:
      import_job_uid: "$.data.uid"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/integrations/import_jobs/{{import_job_uid}}"
    token: staff
    expect:
      status: 200
```