---
endpoint: "GET /platform/v1/scheduling/event_instance/{event_instance_id}"
domain: scheduling
tags: [scheduling, event_instances]
swagger: "swagger/scheduling/legacy/legacy_v1_scheduling.json"
status: verified
savedAt: 2026-02-09T10:07:45.000Z
verifiedAt: 2026-02-09T10:07:45.000Z
timesReused: 0
useFallbackApi: true
---

# Get Event Instance Details

## Summary
Retrieves detailed information about a specific event instance by its ID. **Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required

## Prerequisites

```yaml
steps:
  - id: create_event_instance
    description: "Create an event instance to get a valid ID"
    method: POST
    path: "/v2/event_instances"
    token: staff
    body:
      title: "Test Event {{now_timestamp}}"
      start_time: "{{future_datetime}}"
      end_time: "2026-02-20T11:00:00Z"
      duration: 60
      max_attendance: 10
      interaction_type: "zoom"
      padding: 0
      charge_type: "free"
    extract:
      event_instance_id: "$.uid"
    expect:
      status: 200
    onFail: abort
    useFallbackApi: true
```

## Test Request

```yaml
steps:
  - id: get_event_instance_details
    method: GET
    path: "/platform/v1/scheduling/event_instance/{{event_instance_id}}"
    token: staff
    expect:
      status: 200
```