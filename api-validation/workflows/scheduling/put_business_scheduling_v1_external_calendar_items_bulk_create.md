---
endpoint: "PUT /business/scheduling/v1/external_calendar_items/bulk_create"
domain: scheduling
tags: [calendar, sync, external, scheduling]
swagger: swagger/scheduling/legacy/scheduling.json
status: skip
skip_reason: "Requires CalendarSync record which can only be created via internal API or UI. See VCITA2-11743 for details."
savedAt: 2026-02-01T23:30:00.000Z
---

# Bulk Create External Calendar Items

## Summary
Create multiple external calendar items for a staff member's synced calendar.

## Authentication
Available for **Staff and App tokens**.

## Important Prerequisite

**This endpoint requires the staff member to already have a CalendarSync record and be connected.**

## Prerequisites

**Note**: The staff member must have a CalendarSync record pre-configured and connected. CalendarSync is typically created via the vcita web UI or OAuth flow - there is no public API endpoint for creating CalendarSync records.

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
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: bulk_create_items
    method: PUT
    path: "/business/scheduling/v1/external_calendar_items/bulk_create"
    token: staff
    body:
      staff_uid: "{{staff_id}}"
      calendar_sync:
        provider: "google_v3"
        account: "testuser@gmail.com"
      external_items:
        - external_id: "ext_item_001"
          title: "External Meeting"
          start_time: "{{future_datetime}}"
          end_time: "{{future_datetime_plus_1h}}"
    expect:
      status: 200
```

## Request Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `staff_uid` | Yes | string | The staff member's UID |
| `calendar_sync` | Yes | object | Calendar sync configuration |
| `calendar_sync.provider` | Yes | string | Provider name: "google_v3", "outlook_v1.0" |
| `calendar_sync.account` | Yes | string | The email account |
| `external_items` | Yes | array | Array of external calendar items to create |
| `external_items[].external_id` | Yes | string | External provider's item ID |
| `external_items[].title` | Yes | string | Event title |
| `external_items[].start_time` | Yes | string | Start time (ISO 8601) |
| `external_items[].end_time` | Yes | string | End time (ISO 8601) |

## Expected Response (200)

```json
{
  "success": true,
  "data": {
    "created_count": 1,
    "items": [
      {
        "external_id": "ext_item_001",
        "status": "created"
      }
    ]
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
