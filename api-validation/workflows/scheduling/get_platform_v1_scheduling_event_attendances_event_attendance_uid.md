---
endpoint: "GET /platform/v1/scheduling/event_attendances/{event_attendance_uid}"
domain: scheduling
tags: [scheduling, event_attendances, events]
swagger: "swagger/scheduling/legacy/legacy_v1_scheduling.json"
status: verified
savedAt: 2026-02-09T12:25:00.000Z
verifiedAt: 2026-02-09T12:25:00.000Z
timesReused: 0
useFallbackApi: true
---

# Get Event Attendance

## Summary
Retrieves detailed information about a specific event attendance record (a client's registration to an event instance). **Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required

## Prerequisites

```yaml
steps:
  - id: create_event_instance
    description: "Create an event instance to register a client to"
    method: POST
    path: "/v2/event_instances"
    token: staff
    body:
      title: "Test Event {{now_timestamp}}"
      start_time: "{{future_datetime}}"
      end_time: "2026-03-20T11:00:00Z"
      duration: 60
      max_attendance: 10
      interaction_type: "zoom"
      padding: 0
      charge_type: "free"
    extract:
      event_instance_id: "$.uid"
    expect:
      status: [200, 201]
    onFail: abort
    useFallbackApi: true

  - id: create_event_attendance
    description: "Register a client to the event instance to get an event attendance UID"
    method: POST
    path: "/v2/event_instances/{{event_instance_id}}/event_attendances"
    token: staff
    body:
      client_id: "{{client_id}}"
    extract:
      event_attendance_uid: "$.uid"
    expect:
      status: [200, 201]
    onFail: abort
    useFallbackApi: true
```

## Test Request

```yaml
steps:
  - id: get_event_attendance
    method: GET
    path: "/platform/v1/scheduling/event_attendances/{{event_attendance_uid}}"
    token: staff
    expect:
      status: 200
```

## Authentication

- **Staff tokens**: Recommended. The staff member must belong to the same business.
- **App tokens**: Also supported per the swagger docs.
- **Directory tokens**: Supported with appropriate business context.

## Parameters Reference

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| event_attendance_uid | string | Yes | UID of the event attendance record |

## Expected Response (200)

```json
{
  "status": "OK",
  "data": {
    "event_attendance": {
      "uid": "0uhbjahuijlq35gr",
      "id": "0uhbjahuijlq35gr",
      "event_instance_uid": "pth28g1tzw4mz5qe",
      "event_title": "Test Event",
      "state_summary": {
        "state": "confirmed",
        "state_h": "Registered"
      },
      "client": {
        "uid": "ogfkmy722xd5pq40",
        "full_name": "Test Client"
      },
      "type": "event",
      "source": "initiated_by_staff"
    }
  }
}
```

## Notes

- The endpoint was previously incorrectly documented under the v2 nested path `/api/v2/event_instances/{event_instance_id}/event_attendances/{id}`. That v2 route has `show` in its routes but the controller (`Api::V2::EventAttendanceController`) does not implement a `show` action, returning a 500 error.
- The correct working endpoint is at `/platform/v1/scheduling/event_attendances/{event_attendance_uid}` which uses `Platform::V1::Scheduling::EventAttendancesController#show`.
- Both `id` and `uid` fields in the response contain the same value (the event attendance UID).
