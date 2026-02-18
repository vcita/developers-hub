---
endpoint: "PUT /business/scheduling/v1/external_calendar_items/disconnect"
domain: scheduling
tags: [calendar, sync, external, scheduling]
swagger: "swagger/scheduling/legacy/scheduling.json"
status: pending
savedAt: "2026-02-03T21:28:12.398Z"
timesReused: 0
---

# Disconnect External Calendar

## Summary
Disconnect a staff member's calendar from an external calendar provider. **Token Type**: Requires a **staff token**.

## Prerequisites

```yaml
steps:
  - id: connect_calendar
    description: "First connect a calendar to ensure we have a calendar sync"
    method: PUT
    path: "/business/scheduling/v1/external_calendar_items/connect"
    token: staff
    body:
      staff_uid: "{{staff_id}}"
      calendar_sync:
        provider: "google_v3"
        account: "test@example.com"
    expect:
      status: [200, 422]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: disconnect_calendar
    description: "Disconnect the external calendar"
    method: PUT
    path: "/business/scheduling/v1/external_calendar_items/disconnect"
    token: staff
    body:
      staff_uid: "{{staff_id}}"
      calendar_sync:
        provider: "google_v3"
        account: "test@example.com"
    expect:
      status: [200, 422]
```