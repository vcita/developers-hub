---
endpoint: "POST /v3/apps/staff_widgets_boards"
domain: apps
tags: []
swagger: swagger/apps/widgets_and_boards.json
status: success
savedAt: 2026-01-25T05:28:44.779Z
verifiedAt: 2026-01-25T05:28:44.779Z
---

# Create Staff widgets boards

## Summary
Test passes after resolving uniqueness constraint and using valid widget_uid. The original failure was due to: 1) Duplication error - staff already had a board with type 'home', and 2) Invalid widget_uid 'test_string'.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_staff_widgets_boards
    method: POST
    path: "/v3/apps/staff_widgets_boards"
    body:
      board_layout_code_name: "{{uid}}"
      type: test-unique-1737823095
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
