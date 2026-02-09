---
endpoint: "POST /platform/v1/scheduling/waitlist"
domain: scheduling
tags: [waitlist, event, scheduling]
swagger: "swagger/scheduling/legacy/legacy_v1_scheduling.json"
status: pending
savedAt: "2026-02-01T22:00:00.000Z"
timesReused: 0
---

# Join Event Waitlist

## Summary
Add a client to an event's waitlist. This is used when an event is full and the client wants to be notified if a spot opens up.

## Authentication
Available for **Staff, App, Directory, and Client tokens**.

## Prerequisites

The `event_instance_id` can be obtained from the v2 event instances list endpoint:

```yaml
steps:
  - id: get_event_instances
    description: "Get list of event instances to find an event_instance_id"
    method: GET
    path: "/api/v2/event_instances"
    token: staff
    params:
      by_state: "scheduled"
    extract:
      event_instance_id: "$[0].uid"
    expect:
      status: [200]
    onFail: skip
    skipReason: "No scheduled event instances available. Business may not have group events configured."
```

## Test Request

```yaml
steps:
  - id: join_waitlist
    method: POST
    path: "/platform/v1/scheduling/waitlist"
    token: staff
    body:
      business_id: "{{business_id}}"
      event_instance_id: "{{event_instance_id}}"
      client_id: "{{client_id}}"
    expect:
      status: [201]
```

## Request Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `business_id` | Yes | string | The business UID |
| `event_instance_id` | Yes | string | The event instance UID to join waitlist for |
| `client_id` | Conditional | string | Client UID. Required for Staff/App/Directory tokens |
| `matter_uid` | No | string | Matter/conversation UID to associate |
| `source_name` | No | string | Source name for tracking |
| `channel` | No | string | Source channel for tracking |
| `time_zone` | No | string | Time zone |

## How to Get event_instance_id

The `event_instance_id` represents a single occurrence of a group event. It can be obtained from:

**Option 1: GET /api/v2/event_instances** (Recommended)
```json
[
  {
    "uid": "49rytay9lggliv5f",  // <-- Use this as event_instance_id!
    "title": "Demo class / event",
    "state": "scheduled",
    "start_time": "2025-09-16T14:00:00Z",
    ...
  }
]
```

**Option 2: From booking response**
When creating an event registration via `POST /business/scheduling/v1/bookings`, the response includes `event_instance_id`.

**Option 3: From event attendance**
`GET /platform/v1/scheduling/event_attendances/{uid}` returns `event_instance_uid` in the response.

**Note**: The `GET /api/v2/event_instances` endpoint exists in the routes but is NOT documented in swagger.

## Expected Response (201)

```json
{
  "status": "OK",
  "data": {
    "waitlist": {
      "uid": "kqzp5epsr2wr90pn",
      "event_instance_uid": "49rytay9lggliv5f",
      "client_id": 7203,
      "staff_uid": "91g1yq1uzbypf5wx",
      "status": "pending",
      "spot": 6,
      "title": "Demo class / event",
      "type": "waitlist",
      "initiator": "client",
      "start_time_h": "Thu, September 16 at 2:00pm",
      "where_h": "Modiin, Israel",
      "state_summary": {
        "state": "pending",
        "state_h": "Pending"
      }
    }
  }
}
```

## Error Responses

### 422 - Form Validation Error
```json
{
  "status": "Error",
  "error": "FORM_VALIDATION_ERROR",
  "errors": [
    {"field": "q1a4ndxdo0ppu8gn", "message": "This field cannot be empty"}
  ]
}
```

This error occurs when the event has required form fields. The field IDs are dynamic form field identifiers.

### 422 - Invalid Event Instance
```json
{
  "status": "Error",
  "error": "Invalid event instance"
}
```

## Known Issues

- **Requires existing event**: The business must have group events configured (EventService type services)
- **Form validation errors use opaque IDs**: Error messages reference form field IDs, not readable names
