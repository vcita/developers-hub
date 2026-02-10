---
endpoint: "PUT /business/scheduling/v1/bookings/cancel"
domain: scheduling
tags: [scheduling, bookings, cancel]
swagger: "swagger/scheduling/legacy/scheduling.json"
status: verified
savedAt: "2026-02-01T21:00:00.000Z"
verifiedAt: "2026-02-01T21:00:00.000Z"
timesReused: 0
tokens: [staff]
useFallbackApi: true
---

# Cancel Booking

## Summary
Cancel an existing booking (appointment or event registration). **Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required

## Prerequisites

```yaml
steps:
  - id: get_services
    description: "Get available services for the business"
    method: GET
    path: "/platform/v1/services"
    params:
      business_id: "{{business_id}}"
    extract:
      service_id: "$.data.services[0].id"
    expect:
      status: [200]
    onFail: abort

  - id: get_staffs
    description: "Get staff members for the business"
    method: GET
    path: "/platform/v1/businesses/{{business_id}}/staffs"
    extract:
      staff_id: "$.data.staffs[0].id"
    expect:
      status: [200]
    onFail: abort

  - id: create_booking
    description: "Create a booking to cancel"
    method: POST
    path: "/business/scheduling/v1/bookings"
    token: staff
    body:
      business_id: "{{business_id}}"
      service_id: "{{service_id}}"
      staff_id: "{{staff_id}}"
      start_time: "{{future_datetime}}"
      client_id: "{{client_id}}"
    extract:
      booking_id: "$.data.booking.id"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: cancel_booking
    method: PUT
    path: "/business/scheduling/v1/bookings/cancel"
    token: staff
    body:
      business_id: "{{business_id}}"
      booking_id: "{{booking_id}}"
    expect:
      status: [200, 201]
```