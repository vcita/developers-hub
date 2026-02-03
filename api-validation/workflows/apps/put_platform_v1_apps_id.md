---
endpoint: "PUT /platform/v1/apps/{id}"
domain: apps
tags: []
swagger: swagger/apps/legacy/legacy_v1_apps.json
status: success
savedAt: 2026-01-25T05:53:29.337Z
verifiedAt: 2026-01-25T05:53:29.337Z
---

# Update Apps

## Summary
PUT /platform/v1/apps/{id} endpoint works correctly. Successfully updated app with empty body (HTTP 200) and with actual update data. The original "HTTP null" error appears to have been a transient network/infrastructure issue, not an API problem.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_apps
    method: PUT
    path: "/platform/v1/apps/{id}"
    body:
      name: Updated Test App
      description:
        short_description: This is a test description
    expect:
      status: [200, 201]
```
