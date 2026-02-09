---
endpoint: "PUT /platform/v1/scheduling/waitlist/cancel"
domain: scheduling
tags: [waitlist, event, scheduling, cancel]
swagger: swagger/scheduling/legacy/legacy_v1_scheduling.json
status: pending
savedAt: 2026-02-01T22:00:00.000Z
---

# Cancel Waitlist Registration

## Summary
Cancel a waitlist registration for an event.

## Authentication
Available for **Staff, App, Directory, and Client tokens**.

## Prerequisites

To cancel a waitlist entry, you need:
1. An `event_instance_uid` from an existing event
2. A client who is already on the waitlist for that event

```yaml
steps:
  - id: get_event_instances
    description: "Get list of event instances"
    method: GET
    path: "/api/v2/event_instances"
    token: staff
    params:
      by_state: "scheduled"
    extract:
      event_instance_uid: "$[0].uid"
    expect:
      status: 200
    onFail: skip
    skipReason: "No scheduled event instances available"
```

## Test Request

```yaml
steps:
  - id: cancel_waitlist
    method: PUT
    path: "/platform/v1/scheduling/waitlist/cancel"
    token: staff
    body:
      business_uid: "{{business_id}}"
      event_instance_uid: "{{event_instance_uid}}"
      client_uid: "{{client_id}}"
    expect:
      status: 200
```

## Request Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `business_uid` | Yes | string | The business UID |
| `event_instance_uid` | Yes | string | The event instance UID. Obtain from `GET /api/v2/event_instances` |
| `client_uid` | Conditional | string | Client UID. Required for Staff/App/Directory tokens |
| `matter_uid` | No | string | Matter/conversation UID associated with the waitlist entry |

## How to Get event_instance_uid

See `post_platform_v1_scheduling_waitlist.md` for details on how to obtain `event_instance_uid` from `GET /api/v2/event_instances`.

## Expected Response (200)

```json
{
  "status": "OK",
  "data": {
    "waitlist": {
      "uid": "0noit00aqikuq3n8",
      "event_instance_uid": "a8ma2ephjfvwnvy7",
      "status": "cancelled",
      "state_summary": {
        "state": "cancelled",
        "state_h": "Cancelled"
      }
    }
  }
}
```

## Known Issues

- **Must have existing waitlist entry**: Client must already be on the waitlist to cancel
- **Requires group events**: Business must have EventService type services configured
