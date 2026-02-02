---
endpoint: "POST /v3/apps/app_assignments"
domain: apps
tags: []
swagger: swagger/apps/apps.json
status: success
savedAt: 2026-01-25T05:27:52.104Z
verifiedAt: 2026-01-25T05:27:52.104Z
---

# Create App assignments

## Summary
Test passes after using directory token and valid app_code_name. The endpoint requires directory token authentication and an existing app code name.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_app_assignments
    method: POST
    path: "/v3/apps/app_assignments"
    body:
      assignee_type: business
      assignee_uid: "{{assignee_uid}}"
      app_code_name: testapp123456
      settings:
        assignment_mode: internal
    expect:
      status: [200, 201]
```
