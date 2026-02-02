---
endpoint: "POST /v3/apps/staff_widgets_boards_templates"
domain: apps
tags: []
swagger: swagger/apps/widgets_and_boards.json
status: success
savedAt: 2026-01-25T05:29:22.437Z
verifiedAt: 2026-01-25T05:29:22.437Z
---

# Create Staff widgets boards templates

## Summary
Test passed after removing existing template. The endpoint requires deleting any existing active template before creating a new one, which is documented in the swagger description.

## Prerequisites

```yaml
steps:
  - id: get_staffs
    description: "Fetch available staff members"
    method: GET
    path: "/platform/v1/businesses/{{business_id}}/staffs"
    params:
      per_page: "1"
    extract:
      staff_id: "$.data.staffs[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_staff_widgets_boards_templates
    method: POST
    path: "/v3/apps/staff_widgets_boards_templates"
    body:
      staff_uid: "{{staff_uid}}"
    expect:
      status: [200, 201]
```
