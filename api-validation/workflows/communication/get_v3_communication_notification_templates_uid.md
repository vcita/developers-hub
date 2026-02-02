---
endpoint: "GET /v3/communication/notification_templates/{uid}"
domain: communication
tags: []
swagger: swagger/communication/notification_template.json
status: success
savedAt: 2026-01-27T06:42:19.749Z
verifiedAt: 2026-01-27T06:42:19.749Z
---

# Get Notification templates

## Summary
Test passes. Endpoint successfully retrieves NotificationTemplate with directory token. Original test failed due to invalid UID - resolved by fetching existing template UID from GET /v3/communication/notification_templates.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_notification_templates
    method: GET
    path: "/v3/communication/notification_templates/{uid}"
    expect:
      status: [200, 201]
```
