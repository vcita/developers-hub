---
endpoint: "GET /v3/communication/staff_notifications/{uid}"
domain: communication
tags: [staff_notifications]
swagger: "swagger/communication/staff_notification.json"
status: verified
savedAt: "2026-02-08T20:58:25.000Z"
verifiedAt: "2026-02-08T20:58:25.000Z"
timesReused: 0
tokens: [directory]
---

# Get Staff Notification

## Summary
Retrieves a specific staff notification by UID. **Token Type**: Requires a **directory token** with X-On-Behalf-Of header.

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
  
  - id: create_staff_notification
    description: "Create a staff notification to retrieve"
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
    extract:
      notification_uid: "$.data.uid"
    expect:
      status: 201
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: get_staff_notification
    method: GET
    path: "/v3/communication/staff_notifications/{{notification_uid}}"
    token: directory
    expect:
      status: 200
```