---
endpoint: "GET /v3/communication/notification_templates/{uid}"
domain: communication
tags: []
swagger: "swagger/communication/notification_template.json"
status: verified
savedAt: "2026-01-27T06:42:19.749Z"
verifiedAt: "2026-01-27T06:42:19.749Z"
timesReused: 0
tokens: [directory]
---

# Get Notification Template

## Summary
Retrieves a specific notification template by UID. **Token Type**: Requires a **directory token** with X-On-Behalf-Of header.

## Prerequisites
```yaml
steps:
  - id: get_notification_templates_list
    description: "Fetch notification templates to get a valid UID"
    method: GET
    path: "/v3/communication/notification_templates"
    token: directory
    expect:
      status: 200
    extract:
      uid: "$.data.notification_templates[0].uid"
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: get_notification_template
    method: GET
    path: "/v3/communication/notification_templates/{{uid}}"
    token: directory
    expect:
      status: 200
```