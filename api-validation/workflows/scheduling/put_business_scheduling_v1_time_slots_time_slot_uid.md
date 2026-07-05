---
endpoint: "PUT /business/scheduling/v1/time_slots/{time_slot_uid}"
domain: scheduling
tags: [scheduling, availability, time_slots]
swagger: "swagger/scheduling/legacy/scheduling.json"
status: verified
savedAt: "2026-02-09T22:15:12.398Z"
verifiedAt: "2026-02-09T22:15:12.398Z"
timesReused: 0
useFallbackApi: true
tokens: [admin]
---

# Update Time Slot

## Summary
Update a staff member's time slot in their weekly availability. Available for **Staff and App tokens** (via frontend session) and **Internal (Admin) tokens** (via API).

> ⚠️ Fallback API Required

**Note**: The PUT endpoint requires `Admin` auth prefix for direct API access. Staff/App Bearer tokens return 401 on PUT despite working on POST/DELETE. The frontend works because it runs in a browser session context with different auth flow.

## Prerequisites

```yaml
steps:
  - id: create_time_slot
    description: "Create a time slot on day 0 (Sunday) to get a valid time_slot_uid for update. weekly_availability_uid comes from config params."
    method: POST
    path: "/business/scheduling/v1/time_slots"
    token: staff
    body:
      weekly_availability_uid: "{{weekly_availability_uid}}"
      day: 0
      start_time: "08:00"
      end_time: "12:00"
      new_api: true
      business_id: "{{business_id}}"
    extract:
      time_slot_uid: "$.data.general_availability.time_slots_by_day[0].slots[0].id"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: update_time_slot
    method: PUT
    path: "/business/scheduling/v1/time_slots/{{time_slot_uid}}"
    token: admin
    body:
      weekly_availability_uid: "{{weekly_availability_uid}}"
      start_time: "10:00"
      end_time: "18:00"
      new_api: true
      business_id: "{{business_id}}"
    expect:
      status: [200]
```

## Cleanup

```yaml
steps:
  - id: delete_time_slot
    description: "Remove the test time slot"
    method: DELETE
    path: "/business/scheduling/v1/time_slots/{{time_slot_uid}}"
    token: admin
    expect:
      status: [200]
```

## Authentication
Available for **Internal (Admin) tokens** for direct API access. The frontend uses Staff tokens via browser session auth flow.

## Path Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `time_slot_uid` | Yes | string | Time slot UID from weekly availability |

## Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `weekly_availability_uid` | Yes | string | Weekly availability UID |
| `start_time` | Yes | string | Start time in HH:MM format (24-hour) |
| `end_time` | Yes | string | End time in HH:MM format (24-hour) |
| `business_id` | Yes | string | Business uid for staff token auth context |
| `new_api` | No | boolean | Frontend compatibility flag |

## Expected Response (200)

```json
{
  "success": true,
  "data": {
    "general_availability": {
      "id": 55999401,
      "uid": "qf3qvi2f61cf3sgg",
      "time_slots_by_day": [
        {
          "enabled": true,
          "day": 0,
          "slots": [
            {
              "id": "t0u8rawr38ibvj3o",
              "start_time": "10:00",
              "end_time": "18:00"
            }
          ]
        }
      ]
    }
  }
}
```

## Notes

- `weekly_availability_uid` is provided via config params (originally from `GET /v2/weekly_availabilities`)
- Time format is HH:MM (24-hour format)
- Uses fallback API for routing
- Admin token uses `Admin` prefix (not `Bearer`) for authorization
- The frontend sends `new_api: true` as a compatibility flag
- The `business_id` is required in the body for staff token auth context on the POST create step
