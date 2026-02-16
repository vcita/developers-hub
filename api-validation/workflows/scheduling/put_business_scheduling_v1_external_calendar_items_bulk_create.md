---
endpoint: "PUT /business/scheduling/v1/external_calendar_items/bulk_create"
domain: scheduling
tags: [calendar, sync, external, scheduling]
swagger: "swagger/scheduling/legacy/scheduling.json"
status: verified
savedAt: "2026-02-09T12:00:00.000Z"
verifiedAt: "2026-02-09T12:00:00.000Z"
timesReused: 0
tokens: [staff]
useFallbackApi: true
---

# Bulk Create External Calendar Items

## Summary
Create multiple external calendar items for a staff member's synced calendar. **Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required

## Prerequisites

```yaml
steps:
  - id: create_calendar_sync
    description: "Create a fresh calendar sync record for the staff (resets any existing disabled/stale sync)"
    method: POST
    path: "/platform/v1/scheduling/calendar_syncs"
    token: admin
    body:
      staff_uid: "{{staff_id}}"
      app_code_name: "googlewaysync"
      provider: "google_v3"
      should_import: true
      is_private_import: false
    extract:
      calendar_sync_uid: "$.uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: bulk_create_items
    description: "Bulk create external calendar items"
    method: PUT
    path: "/business/scheduling/v1/external_calendar_items/bulk_create"
    token: staff
    body:
      staff_uid: "{{staff_id}}"
      calendar_sync:
        provider: "google_v3"
        account: "testuser@gmail.com"
      external_items:
        - external_id: "ext_item_{{now_timestamp}}"
          external_title: "External Meeting"
          external_calendar_uid: "{{calendar_sync_uid}}"
          start_date: "{{tomorrow_datetime}}"
          end_date: "{{next_week_datetime}}"
          last_modification: "{{now_datetime}}"
    expect:
      status: 200
```

## Request Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `staff_uid` | Yes | string | The staff member's UID |
| `calendar_sync` | Yes | object | Calendar sync configuration. Must match the staff's existing calendar sync record. |
| `calendar_sync.provider` | Yes | string | Provider name: "google_v3", "outlook_v1.0". Must match the staff's existing calendar sync provider. |
| `calendar_sync.account` | Yes | string | The email account. Must match the staff's existing calendar sync account. If the calendar sync has no account set yet (freshly created), any value can be used and it will be stored. |
| `external_items` | Yes | array | Array of external calendar items to create. Alternatively, use `external_item` (singular) for a single item. |
| `external_items[].external_id` | Yes | string | External provider's item ID |
| `external_items[].external_title` | No | string | Event title |
| `external_items[].external_calendar_uid` | Yes | string | Calendar sync UID (obtained from the calendar sync record). Despite being optional in the swagger schema, the model requires this field. |
| `external_items[].start_date` | Yes | string | Start date (ISO 8601) |
| `external_items[].end_date` | Yes | string | End date (ISO 8601) |
| `external_items[].last_modification` | Yes | string | Last modification timestamp (ISO 8601) |

## Expected Response (200)

```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

## Error Responses

### 422 - Staff Not Registered

```json
{
  "success": false,
  "errors": [
    {
      "code": "missing",
      "message": "staff is not registered to any calendar sync"
    }
  ]
}
```

This error occurs when the staff member does not have a CalendarSync record. Create one first via `POST /platform/v1/scheduling/calendar_syncs`.

### 422 - Staff Already Registered to Other Calendar Sync

```json
{
  "success": false,
  "errors": [
    {
      "code": "already_exists",
      "message": "staff already registered to other calendar sync"
    }
  ]
}
```

This error occurs when the `calendar_sync.provider` or `calendar_sync.account` values do not match the staff member's existing calendar sync record. Either fetch the existing sync to get the correct values, or re-create the sync via `POST /platform/v1/scheduling/calendar_syncs` (which destroys the old sync and creates a fresh one).

### 422 - Staff Account Is Disabled

```json
{
  "success": false,
  "errors": [
    {
      "code": "invalid",
      "message": "staff account is disabled"
    }
  ]
}
```

This error occurs when the calendar sync exists with matching provider/account but is in a disabled state. Re-create the sync via `POST /platform/v1/scheduling/calendar_syncs` to reset it.
