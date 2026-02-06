---
endpoint: "PUT /v3/communication/notification_templates/{uid}"
domain: communication
tags: []
swagger: "swagger/communication/notification_template.json"
status: verified
savedAt: "2026-01-27T06:51:33.256Z"
verifiedAt: "2026-01-27T06:51:33.256Z"
timesReused: 0
---

# Update Notification templates

## Summary
Test passes after fixing deep_link validation format. The deep_link fields must start with '/' and follow specific validation rules.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_notification_templates
    method: PUT
    path: "/v3/communication/notification_templates/{{uid}}"
    body:
      title:
        "0":
          locale: en
          value: test_string
      description:
        "0":
          locale: en
          value: test_string
      category: payments
      configurable_by_staff: true
      content:
        staff_portal:
          title:
            "0":
              locale: en
              value: test_string
          message_body:
            "0":
              locale: en
              value: test_string
          deep_link: /app/settings
        email:
          subject:
            "0":
              locale: en
              value: test_string
          top_image:
            url: test_string
            width: 1
            alt:
              "0":
                locale: en
                value: test_string
          main_title:
            "0":
              locale: en
              value: test_string
          main_text:
            "0":
              locale: en
              value: test_string
          middle_image:
            url: test_string
            width: 1
            alt:
              "0":
                locale: en
                value: test_string
          middle_text:
            "0":
              locale: en
              value: test_string
          footer_text:
            "0":
              locale: en
              value: test_string
          primary_cta_button:
            text:
              "0":
                locale: en
                value: test_string
            url: test_string
            alt:
              "0":
                locale: en
                value: test_string
          secondary_cta_button:
            text:
              "0":
                locale: en
                value: test_string
            url: test_string
            alt:
              "0":
                locale: en
                value: test_string
        sms:
          message_body:
            "0":
              locale: en
              value: test_string
          deep_link: /app/clients/${client_uid}
    expect:
      status: [200, 201]
```
