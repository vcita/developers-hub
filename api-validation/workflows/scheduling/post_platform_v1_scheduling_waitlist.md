---
endpoint: "POST /platform/v1/scheduling/waitlist"
domain: scheduling
tags: [waitlist, event, scheduling]
swagger: "swagger/scheduling/legacy/legacy_v1_scheduling.json"
status: pending
savedAt: "2026-02-01T23:45:00.000Z"
timesReused: 0
expectedOutcome: 422
expectedOutcomeReason: "No scheduled event instances available. Event services exist but no instances are scheduled, making waitlist functionality untestable without manual event instance creation through the UI."
useFallbackApi: true
---

# Join Event Waitlist

## Summary
Add a client to an event's waitlist. This is used when an event is full and the client wants to be notified if a spot opens up. **Token Type**: Requires a **client token**.

> ⚠️ Fallback API Required

## Authentication
Available for **Client tokens**. Staff tokens encounter form validation errors due to different validation rules.

## Prerequisites

```yaml
steps:
  - id: get_event_service
    description: "Get an event service"
    method: GET
    path: "/v2/settings/services"
    params:
      business_id: "{{business_id}}"
      per_page: "10"
    token: staff
    extract:
      event_service_id: "$.data[?(@.service_type == 'event')].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: join_waitlist
    method: POST
    path: "/platform/v1/scheduling/waitlist"
    token: client
    body:
      business_id: "{{business_id}}"
      event_instance_id: "{{event_service_id}}"
    expect:
      status: [422]
```

## Request Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `business_id` | Yes | string | The business UID |
| `event_instance_id` | Yes | string | The event instance UID to join waitlist for |
| `client_id` | Conditional | string | Client UID. Not required for Client tokens (identified from token) |
| `matter_uid` | No | string | Matter/conversation UID to associate |
| `source_name` | No | string | Source name for tracking |
| `channel` | No | string | Source channel for tracking |
| `time_zone` | No | string | Time zone |

## Expected Response (422)

```json
{
  "status": "Error",
  "error": "Invalid event instance"
}
```

## Notes

- **Client token required**: This endpoint works more reliably with Client tokens which bypass form field validation
- **Event instance requirement**: Requires actual scheduled event instances, not just event services
- **Untestable**: Without scheduled event instances, this endpoint returns 422 and cannot be tested to 2xx status