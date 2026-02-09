---
endpoint: "PUT /business/scheduling/v1/time_slots/{time_slot_uid}"
domain: scheduling
tags: [scheduling, availability, time_slots]
swagger: "swagger/scheduling/legacy/scheduling.json"
status: verified
savedAt: "2026-02-01T23:30:00.000Z"
verifiedAt: "2026-02-01T23:30:00.000Z"
timesReused: 0
---

# Update Time Slot

## Summary
Update a staff member's time slot in their weekly availability.

## Authentication
Available for **Staff and App tokens**.

## Prerequisites

The `time_slot_uid` and `weekly_availability_uid` must be obtained from existing availability data.

```yaml
steps:
  - id: get_weekly_availability
    description: "Get weekly availability to find time slot UIDs"
    method: GET
    path: "/api/v2/weekly_availabilities"
    token: staff
    params:
      staff_uid: "{{staff_id}}"
    extract:
      weekly_availability_uid: "$.data.weekly_availabilities[0].uid"
    expect:
      status: [200]
    onFail: abort

  - id: get_time_slots
    description: "Get time slots from weekly availability"
    method: GET
    path: "/api/v2/weekly_availabilities/{{weekly_availability_uid}}"
    token: staff
    params:
      general_availability: "true"
    extract:
      time_slot_uid: "$.data.general_availability.time_slots_by_day[0].time_slots[0].uid"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: update_time_slot
    method: PUT
    path: "/business/scheduling/v1/time_slots/{{time_slot_uid}}"
    token: staff
    body:
      weekly_availability_uid: "{{weekly_availability_uid}}"
      start_time: "09:00"
      end_time: "17:00"
    expect:
      status: [200]
```

## Path Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `time_slot_uid` | Yes | string | Time slot UID from weekly availability |

## Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `weekly_availability_uid` | Yes | string | Weekly availability UID |
| `start_time` | No | string | Start time in HH:MM format |
| `end_time` | No | string | End time in HH:MM format |
| `day` | No | integer | Day of week (0=Sunday, 6=Saturday) |

## Expected Response (200)

```json
{
  "success": true,
  "data": {
    "time_slot": {
      "uid": "ts_abc123",
      "start_time": "09:00",
      "end_time": "17:00",
      "day": 1
    }
  }
}
```

## Error Responses

### 404 - Time Slot Not Found
```json
{
  "status": "Error",
  "error": "Time slot not found"
}
```

### 422 - Invalid Time Range
```json
{
  "status": "Error",
  "errors": [
    {
      "field": "end_time",
      "message": "End time must be after start time"
    }
  ]
}
```

## Notes

- Get `weekly_availability_uid` from `GET /api/v2/weekly_availabilities`
- Get `time_slot_uid` from `GET /api/v2/weekly_availabilities/{uid}?general_availability=true`
- Time format is HH:MM (24-hour format)
