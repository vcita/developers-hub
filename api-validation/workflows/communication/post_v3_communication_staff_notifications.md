---
endpoint: POST /v3/communication/staff_notifications
domain: communication
tags: []
status: pass
savedAt: 2026-01-23T22:25:20.222Z
verifiedAt: 2026-01-23T22:25:20.222Z
timesReused: 0
---
# Create Staff notifications

## Summary
Successfully created a StaffNotification after using a valid notification_template_code_name. The original request failed because 'welcome_staff' is not a valid template code - valid codes must exist in the notification templates database.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| staff_uid | already_resolved | N/A | No |

```json
{
  "staff_uid": {
    "source_endpoint": "already_resolved",
    "resolved_value": "guwtwt70kxgic65r",
    "used_fallback": false,
    "fallback_endpoint": "N/A"
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/v3/communication/staff_notifications",
  "body": {
    "staff_uid": "guwtwt70kxgic65r",
    "notification_template_code_name": "payment_received_notification_test",
    "locale": "en",
    "params": [
      {
        "key": "staff_name",
        "value": "John Doe"
      },
      {
        "key": "business_name",
        "value": "Legal Services Inc"
      }
    ]
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| notification_template_code_name | Documentation doesn't specify that notification_template_code_name values must exist in the system's notification templates database. The example 'welcome_staff' in the documentation does not correspond to any existing template codes. | Update documentation to: 1) Explain that notification_template_code_name must reference an existing template from GET /v3/communication/notification_templates, 2) Replace example 'welcome_staff' with a valid template code like 'payment_received_notification_test' or 'invoice_created', 3) Add a note to check available templates via the notification_templates endpoint before creating staff notifications | critical |