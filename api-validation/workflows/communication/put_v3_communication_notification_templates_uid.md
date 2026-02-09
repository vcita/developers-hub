---
endpoint: "PUT /v3/communication/notification_templates/{uid}"
domain: communication
tags: []
swagger: "swagger/communication/notification_template.json"
status: verified
savedAt: "2026-01-27T06:51:33.256Z"
verifiedAt: "2026-01-27T06:51:33.256Z"
timesReused: 0
tokens: [directory]
---

# Update Notification Template

## Summary
Updates a notification template by UID. **Token Type**: Requires a **directory token** with X-On-Behalf-Of header.

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
  - id: put_notification_template
    method: PUT
    path: "/v3/communication/notification_templates/{{uid}}"
    token: directory
    body:
      title:
        - locale: en
          value: "Updated Test Template {{now_timestamp}}"
      description:
        - locale: en
          value: "Updated test notification template description"
      category: payments
      configurable_by_staff: true
      content:
        staff_portal:
          title:
            - locale: en
              value: "Updated Notification"
          message_body:
            - locale: en
              value: "This is an updated test notification"
          deep_link: "/notifications"
        email:
          subject:
            - locale: en
              value: "Updated Test Subject"
          main_title:
            - locale: en
              value: "Updated Main Title"
          main_text:
            - locale: en
              value: "Updated main message content"
        sms:
          message_body:
            - locale: en
              value: "Updated SMS message"
    expect:
      status: [200, 201]
```