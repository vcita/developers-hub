---
endpoint: "PUT /business/scheduling/v1/external_calendar_items/bulk_deactivate"
domain: scheduling
tags: [calendar, sync, external, scheduling]
swagger: "swagger/scheduling/legacy/scheduling.json"
status: pending
savedAt: "2026-02-09T12:00:00.000Z"
useFallbackApi: true
tokens: [staff]
notes: "Requires a CalendarSync record for the staff member. The prerequisite creates one via POST /business/scheduling/v1/calendar_syncs before calling bulk_deactivate."
---

# Bulk Deactivate External Calendar Items

## Summary
Deactivate multiple external calendar items for a staff member's synced calendar.
**Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required

## Prerequisites

```yaml
steps:
  - id: get_staffs
    description: "Get staff members for the business to obtain a valid staff UID"
    method: GET
    path: "/platform/v1/businesses/{{business_id}}/staffs"
    extract:
      staff_uid: "$.data.staffs[0].id"
    expect:
      status: [200]
    onFail: abort

  - id: create_calendar_sync
    description: "Create a CalendarSync record for the staff member (required by bulk_deactivate's private_connect validation)"
    method: POST
    path: "/business/scheduling/v1/calendar_syncs"
    token: staff
    body:
      staff_uid: "{{staff_uid}}"
      app_code_name: "googlewaysync"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: bulk_deactivate_items
    description: "Bulk deactivate external calendar items for the staff member"
    method: PUT
    path: "/business/scheduling/v1/external_calendar_items/bulk_deactivate"
    token: staff
    body:
      staff_uid: "{{staff_uid}}"
      calendar_sync:
        provider: "google_v3"
        account: "test-calendar-sync@example.com"
      external_items_to_deactivate:
        - external_id: "test_item_nonexistent_123"
    expect:
      status: [200, 201]
```

## Authentication

- **Staff tokens**: Required. The CalendarSyncsAPI.authorize_action checks that the token's user matches the staff's user (`authorize_params[:type] == 'user'` and `authorize_params[:id] == user.id`).
- **Admin tokens**: Also authorized (`authorize_params[:type] == 'admin'`).

## How It Works

### Calendar Sync Setup (Prerequisite)
The `POST /business/scheduling/v1/calendar_syncs` endpoint creates a `CalendarSync` record:
1. Finds the staff by `staff_uid`
2. Maps `app_code_name` to `provider` (e.g., `"googlewaysync"` → `"google_v3"`)
3. Creates a `CalendarSync::ExternalAppSync` record with `enabled: false`
4. Associates it with the staff via `staff_id`

### Bulk Deactivate Flow
The `PUT /business/scheduling/v1/external_calendar_items/bulk_deactivate` endpoint:
1. Calls `private_connect(staff_uid, calendar_sync)` which:
   - Validates staff exists (`Staff.find_by_uid`)
   - Validates `staff.calendar_sync` exists (this is why the prerequisite is needed)
   - Validates the provider matches the existing CalendarSync's provider
   - Since the CalendarSync is `enabled: false` and has no `account` yet, updates it with `{provider, account, enabled: true}`
2. For each item in `external_items_to_deactivate`, finds the `ExternalCalendarItem` by `external_id`
3. Items that don't exist are safely skipped (`nil.try(:deactivate)` returns nil)
4. Returns `{success: true}`

## Parameters Reference

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| staff_uid | string | Yes | Staff UID who owns the calendar sync |
| calendar_sync | object | Yes | Calendar sync details (must have `provider` and `account`) |
| calendar_sync.provider | string | Yes | Provider name (e.g., `"google_v3"`, `"outlook_v1.0"`) |
| calendar_sync.account | string | Yes | Account identifier (e.g., email address) |
| external_items_to_deactivate | array | Yes | Array of items to deactivate, each with `external_id` |

## Expected Response (200)

```json
{
  "success": true
}
```

## Error Responses

### 422 - Staff Not Exists
```json
{
  "status": "Error",
  "error": "staff is not exists"
}
```
Occurs when `staff_uid` doesn't match any staff in the database.

### 422 - Staff Not Registered
```json
{
  "status": "Error",
  "error": "staff is not registered to any calendar sync"
}
```
Occurs when the staff doesn't have a CalendarSync record. Fix: run the `create_calendar_sync` prerequisite first.

### 422 - Staff Already Registered
```json
{
  "status": "Error",
  "error": "staff already registered to other calendar sync"
}
```
Occurs when the staff has a CalendarSync with a different provider or account than what was sent in the request.

## Known Issues

### Issue: CalendarSync provider must match
The `provider` in the bulk_deactivate request must match the `provider` set on the staff's CalendarSync record. Since the prerequisite creates the CalendarSync with `app_code_name: "googlewaysync"` (which maps to `provider: "google_v3"`), the test request must also use `provider: "google_v3"`.

## Notes

- The `private_connect` method both validates and enables the CalendarSync in a single call
- Valid `app_code_name` values: `"googlewaysync"` (Google), `"outlookwaysync"` (Outlook), `"mockcalendarwaysync"` (Mock)
- These map to providers: `"google_v3"`, `"outlook_v1.0"`, `"mock_provider"` respectively
- Non-existent external items in the deactivation list are safely skipped (no error raised)
