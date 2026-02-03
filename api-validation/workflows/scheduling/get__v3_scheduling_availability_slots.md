---
endpoint: "GET /v3/scheduling/availability_slots"
domain: scheduling
tags: [scheduling, availability, slots]
swagger: mcp_swagger/scheduling.json
status: working
savedAt: 2026-02-02T16:30:00.000Z
---

# Get Availability Slots

## Summary
Returns available time slots for booking appointments. Considers staff schedules, resource availability, existing bookings, and business hours to compute open slots.

## Authentication
Available for **Staff tokens** (OAuth 2.0).

## Test Request

```yaml
steps:
  - id: get_availability_slots
    method: GET
    path: "/v3/scheduling/availability_slots"
    token: staff
    params:
      start_time: "{{today_datetime_utc}}"
      end_time: "{{datetime_plus_1_day_utc}}"
    expect:
      status: 200
```

## Query Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `start_time` | Yes | string | Start time in ISO 8601 format (UTC). Example: `2025-05-19T00:00:00.000Z` |
| `end_time` | Yes | string | End time in ISO 8601 format (UTC). Must be after start_time. Example: `2025-05-20T00:00:00.000Z` |
| `service_uid` | No | string | Filter by service UID |
| `resource_type_uids` | No | string | Comma-separated list of resource type UIDs |
| `resource_uids` | No | string | Comma-separated list of resource UIDs |
| `staff_uids` | No | string | Comma-separated list of staff UIDs |
| `slot_duration` | No | integer | Desired slot duration in minutes. Min: 1 |
| `slot_interval` | No | integer | Interval between slots in minutes. **Requires slot_duration.** Min: 1 |
| `padding_before` | No | integer | Padding before each slot in minutes. **Requires slot_duration.** Min: 0 |
| `padding_after` | No | integer | Padding after each slot in minutes. **Requires slot_duration.** Min: 0 |
| `exclude_booking_uid` | No | string | Booking UID to exclude from busy slots (useful for rescheduling) |

## Filtering Behavior

- If no filters (`resource_type_uids`, `resource_uids`, `staff_uids`, `service_uid`) are provided, returns **all available slots** for the time range.
- Multiple filters combine with AND logic (intersection).
- `staff_uids` and resource filters combine with intersection.

## Slot Mode Behavior

- **Without `slot_duration`**: Returns dynamic slots representing available time ranges (e.g., 10:00-12:00, 13:00-17:00)
- **With `slot_duration`**: Returns fixed-duration slots at regular intervals

## Expected Response (200)

```json
{
  "success": true,
  "data": {
    "availability_slots": [
      {
        "start_time": "2025-05-19T09:00:00.000Z",
        "end_time": "2025-05-19T10:00:00.000Z"
      }
    ]
  }
}
```

## Error Responses

### 400 - Invalid Parameters
```json
{
  "success": false,
  "errors": [
    {
      "message": "start_time must be a valid ISO date format",
      "code": "bad_request"
    }
  ]
}
```

### 400 - Missing slot_duration
```json
{
  "success": false,
  "errors": [
    {
      "message": "slot_interval is not supported without slot_duration",
      "code": "bad_request"
    }
  ]
}
```

### 401 - Unauthorized
```json
{
  "error": "Unauthorized"
}
```

## Notes

- **Staff token required**: OAuth 2.0 authentication with staff-level permissions.
- **Timeout**: 30 seconds (high timeout due to complex availability calculations).
- **Time discretization**: Internally uses 5-minute time slots (bitmap-based calculation).
- `slot_interval`, `padding_before`, and `padding_after` are **only valid when `slot_duration` is provided**.
