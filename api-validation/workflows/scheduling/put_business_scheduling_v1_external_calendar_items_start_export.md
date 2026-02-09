---
endpoint: "PUT /business/scheduling/v1/external_calendar_items/start_export"
domain: scheduling
tags: [calendar, sync, external, scheduling]
swagger: "swagger/scheduling/legacy/scheduling.json"
status: skipped
savedAt: "2026-02-01T23:30:00.000Z"
timesReused: 0
skip_reason: "Requires CalendarSync record which can only be created via internal API or UI. See VCITA2-11743 for details."
---

# Start External Calendar Export

## Summary
Start exporting calendar items to an external calendar provider.

## Authentication
Available for **Staff and App tokens**.

## Important Prerequisite

**This endpoint requires the staff member to already have a CalendarSync record and be connected.**

## Prerequisites

**Note**: The staff member must have a CalendarSync record pre-configured. CalendarSync is typically created via the vcita web UI or OAuth flow - there is no public API endpoint for creating CalendarSync records.

```yaml
steps:
  - id: connect_calendar
    description: "Ensure calendar is connected first"
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
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: start_export
    method: PUT
    path: "/business/scheduling/v1/external_calendar_items/start_export"
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
| `calendar_sync.provider` | Yes | string | Provider name: "google_v3", "outlook_v1.0" |
| `calendar_sync.account` | Yes | string | The email account |

## Expected Response (200)

```json
{
  "success": true,
  "data": {
    "uid": "9t1dcewjh54k3t91",
    "staff_uid": "f67acee343b4a38b",
    "should_export": true
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
