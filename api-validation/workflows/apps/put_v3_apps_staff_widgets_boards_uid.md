---
endpoint: "PUT /v3/apps/staff_widgets_boards/{uid}"
domain: apps
tags: []
swagger: swagger/apps/widgets_and_boards.json
status: success
savedAt: 2026-01-25T05:34:59.650Z
verifiedAt: 2026-01-25T05:34:59.650Z
---

# Update Staff widgets boards

## Summary
Successfully updated Staff Widgets Board after resolving widget_uid and using existing board

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_staff_widgets_boards
    method: PUT
    path: "/v3/apps/staff_widgets_boards/{uid}"
    body:
      board_layout_code_name: "{{uid}}"
      type: home
      sections:
        "0":
          code_name: main
          widgets:
            "0":
              widget_uid: "{{widget_uid}}"
              dimensions:
                height: 1
                width: 1
    expect:
      status: [200, 201]
```
