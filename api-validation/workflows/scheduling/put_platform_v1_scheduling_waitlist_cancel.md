---
endpoint: "PUT /platform/v1/scheduling/waitlist/cancel"
domain: scheduling
tags: [waitlist, event, scheduling, cancel]
swagger: "swagger/scheduling/legacy/legacy_v1_scheduling.json"
status: pending
savedAt: "2026-02-09T13:20:00.000Z"
timesReused: 0
useFallbackApi: true
---

# Cancel Waitlist Registration

## Summary
Cancel a waitlist registration for an event. **Token Type**: Requires a **Client token**. The controller inherits from `Api::ClientApi::V1::BaseController` which only accepts client authentication.

> ⚠️ Fallback API Required

## Authentication
Available for **Client tokens** only via the fallback API. The `client_uid` must be explicitly included in the request body for the `authorize_action(:cancel_waitlist)` check to pass.

## Prerequisites

```yaml
steps:
  - id: create_event_instance
    description: "Create an event instance with max_attendance 1"
    method: POST
    path: "/v2/event_instances"
    token: staff
    body:
      title: "Waitlist Cancel Test {{now_timestamp}}"
      start_time: "{{future_datetime}}"
      end_time: "2026-02-20T11:00:00Z"
      duration: 60
      max_attendance: 1
      interaction_type: "zoom"
      padding: 0
      charge_type: "free"
    extract:
      event_instance_uid: "$.uid"
    expect:
      status: [200]
    onFail: abort
    useFallbackApi: true

  - id: create_temp_client
    description: "Create a temporary client to fill the event"
    method: POST
    path: "/platform/v1/clients"
    token: staff
    body:
      business_id: "{{business_id}}"
      first_name: "WaitlistTemp"
      last_name: "Client{{now_timestamp}}"
      email: "waitlist_temp_{{now_timestamp}}@test.com"
    extract:
      temp_client_uid: "$.data.client.id"
    expect:
      status: [200, 201]
    onFail: abort
    useFallbackApi: true

  - id: fill_event
    description: "Book the temp client into the event to fill it (max_attendance: 1)"
    method: POST
    path: "/business/scheduling/v1/bookings"
    token: staff
    body:
      business_id: "{{business_id}}"
      event_instance_id: "{{event_instance_uid}}"
      client_id: "{{temp_client_uid}}"
      staff_id: "{{staff_id}}"
    expect:
      status: [200, 201]
    onFail: abort
    useFallbackApi: true

  - id: add_to_waitlist
    description: "Add the test client to the full event waitlist via business API"
    method: POST
    path: "/business/scheduling/v1/waitlist/bulk_create"
    token: staff
    body:
      event_instance_uid: "{{event_instance_uid}}"
      matter_uids: "{{matter_uid}}"
    expect:
      status: [200, 201]
    onFail: abort
    useFallbackApi: true
```

## Test Request

```yaml
steps:
  - id: cancel_waitlist
    method: PUT
    path: "/platform/v1/scheduling/waitlist/cancel"
    token: client
    body:
      business_uid: "{{business_id}}"
      event_instance_uid: "{{event_instance_uid}}"
      matter_uid: "{{matter_uid}}"
      client_uid: "{{client_uid}}"
    expect:
      status: [200]
```

## Request Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `business_uid` | Yes | string | The business UID |
| `event_instance_uid` | Yes | string | The event instance UID to cancel waitlist from |
| `client_uid` | Yes | string | Client UID. Must be explicitly provided for authorization to pass |
| `matter_uid` | Yes | string | Matter/conversation UID. Used to look up the waitlist entry |
| `message` | No | string | Optional cancellation message |

## Expected Response (200)

```json
{
  "uid": "vvsyf7j9soz1nl4u",
  "status": "cancelled",
  "state_summary": {
    "state": "cancelled",
    "state_h": "Cancelled"
  },
  "title": "Waitlist Cancel Test",
  "event_instance_uid": "hlyie1gmyk7qi1bq",
  "type": "waitlist"
}
```

## Notes

- **Client token required**: The platform controller inherits from `Api::ClientApi::V1::BaseController` which only supports client authentication
- **client_uid must be explicit**: Even with a client token, `client_uid` must be in the request body. The controller extracts it from `params[:client_uid]`, not from the token. Without it, `authorize_action(:cancel_waitlist)` returns Unauthorized.
- **Event must be full**: Waitlist entries can only be created when the event is at capacity (max_attendance reached). The prerequisite creates an event with max_attendance: 1, fills it, then adds the test client to the waitlist.
- **Business API alternative**: Staff can cancel waitlist entries via `PUT /business/scheduling/v1/waitlist/cancel` which accepts staff tokens and supports `waitlist_uid` parameter
