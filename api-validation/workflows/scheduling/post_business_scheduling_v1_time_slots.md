---
endpoint: "POST /business/scheduling/v1/time_slots"
domain: scheduling
tags: [availability, time-slots, scheduling]
swagger: swagger/scheduling/legacy/scheduling.json
status: pending
savedAt: 2026-02-01T22:00:00.000Z
---

# Create Time Slot

## Summary
Create a new time slot for staff availability. This is part of the general availability management system.

## Authentication
Available for **Staff and App tokens**.

## Prerequisites

The `weekly_availability_uid` is obtained from the staff scheduling endpoint:

```yaml
steps:
  - id: get_staff_with_availability
    description: "Get staff details including weekly_availability_uid"
    method: GET
    path: "/platform/v1/scheduling/staff/{{staff_id}}"
    token: staff
    params:
      business_id: "{{business_id}}"
      only_active_services: "true"
    extract:
      weekly_availability_uid: "$.data.staff.weekly_availability_uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: create_time_slot
    method: POST
    path: "/business/scheduling/v1/time_slots"
    token: staff
    body:
      weekly_availability_uid: "{{weekly_availability_uid}}"
      day: 1
      start_time: "09:00"
      end_time: "17:00"
    expect:
      status: 201
```

## Request Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `weekly_availability_uid` | Yes | string | The weekly availability UID. Obtained from `GET /platform/v1/scheduling/staff/{staff_uid}` response field `weekly_availability_uid` |
| `day` | Yes | integer | Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday |
| `start_time` | Yes | string | Start time in HH:MM format (e.g., "09:00") |
| `end_time` | Yes | string | End time in HH:MM format (e.g., "17:00") |

## How to Get weekly_availability_uid

The `weekly_availability_uid` represents a staff member's weekly schedule configuration. It can be obtained from:

**Option 1: GET /platform/v1/scheduling/staff/{staff_uid}**
```json
{
  "data": {
    "staff": {
      "uid": "abc123",
      "weekly_availability_uid": "sjq2twnw8z0h33f0",  // <-- Use this!
      ...
    }
  }
}
```

**Note**: The swagger documentation example doesn't show this field, but it IS returned by the API (verified in `StaffDecorator.api_json`).

## Expected Response (201)

```json
{
  "success": true,
  "data": {
    "general_availability": {
      "id": 123,
      "uid": "sjq2twnw8z0h33f0",
      "time_slots_by_day": [
        {
          "day": 0,
          "enabled": true,
          "slots": [
            {"id": "40ci67hckste9xax", "start_time": "20:00", "end_time": "22:00"}
          ]
        },
        {
          "day": 1,
          "enabled": true,
          "slots": [
            {"id": "phmiv974egfuyx84", "start_time": "09:00", "end_time": "17:00"}
          ]
        }
      ]
    }
  }
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "status": "Error",
  "error": "Unauthorized"
}
```

### 400 - Missing weekly_availability_uid
```json
{
  "status": "Error",
  "error": "Mandatory parameter weekly_availability_uid is missing"
}
```

## Related Endpoints

- PUT /business/scheduling/v1/time_slots/{time_slot_uid} - Update time slot
- DELETE /business/scheduling/v1/time_slots/{time_slot_uid} - Delete time slot
