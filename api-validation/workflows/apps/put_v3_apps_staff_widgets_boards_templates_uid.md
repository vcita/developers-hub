---
endpoint: "PUT /v3/apps/staff_widgets_boards_templates/{uid}"
domain: apps
tags: []
swagger: "swagger/apps/widgets_and_boards.json"
status: verified
savedAt: "2026-01-25T05:35:33.882Z"
verifiedAt: "2026-01-25T05:35:33.882Z"
timesReused: 0
---

# Update Staff widgets boards templates

## Summary
Test passes with directory token and existing template UID. Original failure was due to using non-existent UID 'f48ad6c8-d99c-4ae1-a245-0d0523f29f67' instead of actual template UID.

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
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: put_staff_widgets_boards_templates
    method: PUT
    path: "/v3/apps/staff_widgets_boards_templates/{{uid}}"
    body:
      staff_uid: "{{staff_uid}}"
    expect:
      status: [200, 201]
```
