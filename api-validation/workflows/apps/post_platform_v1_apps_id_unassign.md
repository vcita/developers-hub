---
endpoint: "POST /platform/v1/apps/{id}/unassign"
domain: apps
tags: []
swagger: swagger/apps/legacy/legacy_v1_apps.json
status: success
savedAt: 2026-01-25T06:08:23.820Z
verifiedAt: 2026-01-25T06:08:23.820Z
---

# Create Unassign

## Summary
Successfully unassigned app from directory. The endpoint requires app_code_name (string) in the URL path, not numeric app_id. Endpoint returned HTTP 201 with {"assignment": null} indicating successful unassignment.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_unassign
    method: POST
    path: "/platform/v1/apps/{id}/unassign"
    body:
      directory_uid: "{{directory_uid}}"
    expect:
      status: [200, 201]
```
