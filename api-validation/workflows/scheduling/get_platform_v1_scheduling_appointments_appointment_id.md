---
endpoint: "GET /platform/v1/scheduling/appointments/{appointment_id}"
domain: scheduling
tags: [scheduling, appointments]
swagger: "swagger/scheduling/legacy/legacy_v1_scheduling.json"
status: verified
savedAt: 2026-02-09T09:30:00.000Z
verifiedAt: 2026-02-09T09:30:00.000Z
timesReused: 0
---

# Get Appointment Details

## Summary
Retrieves detailed information about a specific appointment by its ID. **Token Type**: Requires a **staff token**.

## Prerequisites

```yaml
steps:
  - id: get_appointment_list
    description: "Fetch appointments to get a valid appointment ID"
    method: GET
    path: "/platform/v1/scheduling/appointments"
    token: staff
    params:
      per_page: 1
    extract:
      appointment_id: "$.data.appointments[0].id"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_appointment_details
    method: GET
    path: "/platform/v1/scheduling/appointments/{{appointment_id}}"
    token: staff
    expect:
      status: 200
```