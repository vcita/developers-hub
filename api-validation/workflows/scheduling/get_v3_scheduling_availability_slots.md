---
endpoint: "GET /v3/scheduling/availability_slots"
domain: scheduling
tags: [scheduling, availability, slots]
swagger: "swagger/scheduling/availability_slots.json"
status: verified
savedAt: 2026-02-02T02:30:00.000Z
verifiedAt: 2026-02-02T02:30:00.000Z
timesReused: 0
tokens: [staff, directory]
---

# Get Availability Slots

## Summary
Returns available time slots for booking appointments. Considers staff schedules, resource availability, existing bookings, and business hours to compute open slots. **Token Type**: Available for **Staff tokens** and **Directory tokens**.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_availability_slots
    method: GET
    path: "/v3/scheduling/availability_slots"
    token: staff
    params:
      start_time: "2026-02-03T09:00:00.000Z"
      end_time: "2026-02-03T17:00:00.000Z"
    expect:
      status: [200]
```

## Query Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `start_time` | Yes | string | Start time for availability search in ISO 8601 format (UTC). Must be a valid date-time string. |
| `end_time` | Yes | string | End time for availability search in ISO 8601 format (UTC). Must be after start_time. Recommended range is up to 31 days. |
| `service_uid` | No | string | Unique identifier of the service |
| `resource_type_uids` | No | string | Comma-separated list of resource type UIDs |
| `resource_uids` | No | string | Comma-separated list of resource UIDs |
| `staff_uids` | No | string | Comma-separated list of staff UIDs |
| `slot_duration` | No | integer | Duration of each slot in minutes |
| `slot_interval` | No | integer | Interval between slots in minutes |
| `padding_before` | No | integer | Padding time before each slot in minutes |
| `padding_after` | No | integer | Padding time after each slot in minutes |
| `exclude_booking_uid` | No | string | Unique identifier of a booking to exclude from busy slots calculation |

## Expected Response (200)

```json
{
  "success": true,
  "data": {
    "availability_slots": [
      {
        "start": "2026-02-03T09:00:00.000Z",
        "end": "2026-02-03T17:00:00.000Z",
        "available_entities": []
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
      "message": [
        "start_time should not be empty",
        "start_time must be a valid ISO 8601 date string",
        "end_time should not be empty", 
        "end_time must be a valid ISO 8601 date string"
      ],
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

### 404 - Not Found
```json
{
  "error": "Service or specified resources not found"
}
```

## Notes

- **Token support**: Works with both Staff and Directory tokens
- **Required parameters**: Both start_time and end_time must be provided in ISO 8601 format (UTC)
- **Time range**: Recommended range is up to 31 days between start_time and end_time
- **Resource filtering**: At least one of resource_type_uids, resource_uids, or staff_uids should be provided for targeted availability search
- **Booking exclusion**: Use exclude_booking_uid parameter for rescheduling scenarios