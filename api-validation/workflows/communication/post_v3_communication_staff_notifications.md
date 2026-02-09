---
endpoint: "POST /v3/communication/staff_notifications"
domain: communication
tags: []
swagger: swagger/communication/staff_notification.json
status: success
savedAt: 2026-01-27T06:22:34.971Z
verifiedAt: 2026-01-27T06:22:34.971Z
---

# Create Staff notifications

## Summary
Test passes after resolving notification template code name and using directory token. The endpoint successfully created a StaffNotification with HTTP 201.

## Prerequisites

```yaml
steps:
  - id: get_staffs
    description: "Fetch available staff members"
    method: GET
    path: "/platform/v1/businesses/{{business_id}}/staffs"
    params:
      per_page: "1"
    extract:
      staff_id: "$.data.staffs[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_staff_notifications
    method: POST
    path: "/v3/communication/staff_notifications"
    body:
      staff_uid: "{{staff_uid}}"
      notification_template_code_name: test_template_1734462000
      locale: en
      params:
        "0":
          key: test_string
          value: test_string
    expect:
      status: [200, 201]
```
