---
endpoint: "PUT /business/scheduling/v1/external_calendar_items/connect"
domain: scheduling
tags: [calendar, sync, external, scheduling]
swagger: "swagger/scheduling/legacy/scheduling.json"
status: skipped
savedAt: "2026-02-01T23:30:00.000Z"
timesReused: 0
skip_reason: "Requires CalendarSync record which can only be created via internal API or UI. See VCITA2-11743 for details."
---

# Connect External Calendar

## Summary
Connect a staff member's calendar to an external calendar provider (Google, Outlook, etc.).

## Authentication
Available for **Staff and App tokens**.

## Important Prerequisite

**This endpoint requires the staff member to already have a CalendarSync record in the database.** 

The CalendarSync record can be created via:
1. `POST /business/scheduling/v1/calendar_syncs` API endpoint (see Prerequisites below)
2. The vcita web UI (Settings > Calendar Sync)
3. OAuth flow with the external calendar provider

## Prerequisites

**Note**: The staff member must have a CalendarSync record pre-configured. CalendarSync is typically created via the vcita web UI or OAuth flow with an external calendar provider - there is no public API endpoint for creating CalendarSync records.

If testing in a fresh environment, ensure the test staff member has connected their calendar via the UI before running these tests.

## Test Request

```yaml
steps:
  - id: connect_calendar
    method: PUT
    path: "/business/scheduling/v1/external_calendar_items/connect"
    token: staff
    body:
      staff_uid: "{{staff_id}}"
      calendar_sync:
        provider: "google_v3"
        account: "testuser@gmail.com"
    expect:
      status: [200]
```

## Request Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `staff_uid` | Yes | string | The staff member's UID |
| `calendar_sync` | Yes | object | Calendar sync configuration |
| `calendar_sync.provider` | Yes | string | Provider name: "google_v3", "outlook", "apple" |
| `calendar_sync.account` | Yes | string | The email account to sync (e.g., "user@gmail.com") |

## Expected Response (200)

```json
{
  "success": true,
  "data": {
    "uid": "9t1dcewjh54k3t91",
    "staff_uid": "f67acee343b4a38b",
    "provider": "google_v3",
    "account": "fakeemail@gmail.com",
    "enabled": false,
    "should_import": true,
    "should_export": true,
    "is_external_app": true,
    "is_private_import": true,
    "is_private_export": true,
    "is_staff_disable_ics": false,
    "is_business_disable_ics": false
  }
}
```

## Error Responses

### 422 - Staff Not Registered
```json
{
  "status": "Error",
  "errors": [
    {
      "code": "missing",
      "field": "staff",
      "message": "staff is not registered to any calendar sync"
    }
  ]
}
```

This error occurs when the staff member does not have a CalendarSync record. This is the most common failure mode in testing.

### 422 - Missing calendar_sync fields
```json
{
  "status": "Error",
  "errors": [
    {
      "code": "missing_field",
      "field": "account",
      "message": "Mandatory parameter account is missing"
    }
  ]
}
```

## Valid app_code_name Values

| app_code_name | Provider |
|---------------|----------|
| `googlewaysync` | `google_v3` |
| `outlookwaysync` | `outlook_v1.0` |

## Related Endpoints

All external_calendar_items endpoints require a CalendarSync to be created first:
- PUT /business/scheduling/v1/external_calendar_items/connect
- PUT /business/scheduling/v1/external_calendar_items/disconnect
- PUT /business/scheduling/v1/external_calendar_items/disable
- PUT /business/scheduling/v1/external_calendar_items/bulk_create
- PUT /business/scheduling/v1/external_calendar_items/bulk_deactivate
- PUT /business/scheduling/v1/external_calendar_items/start_export
- PUT /business/scheduling/v1/external_calendar_items/stop_import
