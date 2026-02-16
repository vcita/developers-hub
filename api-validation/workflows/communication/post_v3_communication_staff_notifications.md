---
endpoint: "POST /v3/communication/staff_notifications"
domain: communication
tags: [staff_notifications]
swagger: swagger/communication/staff_notification.json
status: verified
savedAt: 2026-02-08T20:42:20.970Z
verifiedAt: 2026-02-08T20:42:20.970Z
timesReused: 0
tokens: [directory]
---

# Create Staff Notification

## Summary
Creates a new staff notification using a notification template. **Token Type**: Requires a **directory token** with X-On-Behalf-Of header.

## Prerequisites
```yaml
steps:
  - id: get_notification_template
    description: "Fetch an available notification template"
    method: GET
    path: "/v3/communication/notification_templates"
    token: directory
    params:
      per_page: "1"
    extract:
      template_code_name: "$.data.notification_templates[0].code_name"
    expect:
      status: 200
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: create_staff_notification
    method: POST
    path: "/v3/communication/staff_notifications"
    token: directory
    body:
      staff_uid: "{{staff_id}}"
      notification_template_code_name: "{{template_code_name}}"
      locale: en
      params:
        - key: test_string
          value: test_string
    expect:
      status: 201
```