---
endpoint: "GET /v3/communication/notification_templates"
domain: communication
tags: [notification_templates]
swagger: "swagger/communication/notification_template.json"
status: verified
savedAt: 2026-01-27T07:00:00.000Z
verifiedAt: 2026-01-27T07:00:00.000Z
timesReused: 0
tokens: [directory]
---

# List Notification Templates

## Summary
Retrieves a list of notification templates for the directory. **Token Type**: Requires a **directory token** with X-On-Behalf-Of header.

## Test Request
```yaml
steps:
  - id: list_notification_templates
    method: GET
    path: "/v3/communication/notification_templates"
    token: directory
    expect:
      status: 200
```