---
endpoint: "POST /v3/apps/widgets"
domain: apps
tags: []
swagger: "swagger/apps/widgets_and_boards.json"
status: verified
savedAt: "2026-01-25T05:30:13.157Z"
verifiedAt: "2026-01-25T05:30:13.157Z"
timesReused: 0
---

# Create Widgets

## Summary
Successfully created widget after acquiring proper app token. The endpoint requires an app token from an app with app_type='widgets', which was documented in swagger and confirmed by testing.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_widgets
    method: POST
    path: "/v3/apps/widgets"
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
      component_data:
        name: test_string
        config: {}
    expect:
      status: [200, 201]
```
