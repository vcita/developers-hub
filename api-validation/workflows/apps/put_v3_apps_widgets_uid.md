---
endpoint: "PUT /v3/apps/widgets/{uid}"
domain: apps
tags: []
swagger: swagger/apps/widgets_and_boards.json
status: success
savedAt: 2026-01-25T05:36:16.937Z
verifiedAt: 2026-01-25T05:36:16.937Z
---

# Update Widgets

## Summary
Successfully updated widget after creating an app with app_type='widgets' and obtaining the required app token. The original 404 error was due to using a non-existent widget UID. Created a fresh widget and the update operation succeeded.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_widgets
    method: PUT
    path: "/v3/apps/widgets/{uid}"
    body:
      display_name:
        en: test_string
        es: test_string
        fr: test_string
        it: test_string
        pt: test_string
        de: test_string
        pl: test_string
        nl: test_string
        he: test_string
        sl: test_string
      component_data:
        name: test_string
        config: {}
      dimensions:
        max_height: 1
        min_height: 1
        height: 1
        max_width: 1
        min_width: 1
        width: 1
      permissions:
        "0": test_string
      module: test_string
    expect:
      status: [200, 201]
```
