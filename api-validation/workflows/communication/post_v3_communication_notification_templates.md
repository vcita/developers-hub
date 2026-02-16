---
endpoint: "POST /v3/communication/notification_templates"
domain: communication
tags: [notification_templates]
swagger: "swagger/communication/notification_template.json"
status: verified
savedAt: "2026-02-08T20:40:18.740Z"
verifiedAt: "2026-02-08T20:40:18.740Z"
timesReused: 0
tokens: [directory]
---

# Create Notification Template

## Summary
Creates a new notification template. **Token Type**: Requires a **directory token** with X-On-Behalf-Of header.

## Test Request
```yaml
steps:
  - id: create_notification_template
    method: POST
    path: "/v3/communication/notification_templates"
    token: directory
    body:
      code_name: "test_template_{{random_string}}"
      title:
        - locale: en
          value: "Test Template {{now_timestamp}}"
      description:
        - locale: en
          value: "A test notification template"
      category: payments
      configurable_by_staff: true
      content:
        staff_portal:
          title:
            - locale: en
              value: "Test Notification"
          message_body:
            - locale: en
              value: "This is a test notification"
          deep_link: "/notifications"
        email:
          subject:
            - locale: en
              value: "Test Subject"
          main_title:
            - locale: en
              value: "Main Title"
          main_text:
            - locale: en
              value: "Main message content"
        sms:
          message_body:
            - locale: en
              value: "SMS message"
    expect:
      status: 201
```