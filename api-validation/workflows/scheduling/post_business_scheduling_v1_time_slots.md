---
endpoint: "POST /business/scheduling/v1/time_slots"
domain: scheduling
tags: [availability, time-slots, scheduling]
swagger: "swagger/scheduling/legacy/scheduling.json"
status: verified
savedAt: "2026-02-09T12:00:00.000Z"
verifiedAt: "2026-02-09T12:00:00.000Z"
timesReused: 0
useFallbackApi: true
tokens: [staff]
---

# Create Time Slot

## Summary
Create a new time slot for staff availability. This is part of the general availability management system.

> ⚠️ Fallback API Required

**Important**: The `business_id` parameter is required in the request body for staff token authorization. Without it, the endpoint returns 401 Unauthorized because the backend cannot resolve the business context from the token alone on this endpoint.

## Prerequisites

```yaml
steps:
  - id: get_weekly_availability
    description: "Get weekly availability to obtain weekly_availability_uid"
    method: GET
    path: "/v2/weekly_availabilities"
    token: staff
    params:
      staff_uid: "{{staff_id}}"
    extract:
      weekly_availability_uid: "$[0].uid"
    expect:
      status: [200]
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
      new_api: true
      business_id: "{{business_id}}"
    expect:
      status: [201]
```

## Authentication
Available for **Staff tokens**.

## Request Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `business_id` | Yes | string | Business uid. Required for staff token authorization context resolution. |
| `weekly_availability_uid` | Yes | string | The weekly availability UID. Obtained from `GET /v2/weekly_availabilities` response field `uid` |
| `day` | Yes | integer | Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday |
| `start_time` | Yes | string | Start time in HH:MM format (e.g., "09:00") |
| `end_time` | Yes | string | End time in HH:MM format (e.g., "17:00") |
| `new_api` | No | boolean | Frontend compatibility flag |

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