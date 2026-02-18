---
endpoint: "POST /platform/v1/scheduling/bookings/cancel"
domain: scheduling
tags: [booking, appointment, scheduling, platform, cancel]
swagger: "swagger/scheduling/legacy/scheduling.json"
status: pending
savedAt: "2026-02-01T16:00:00.000Z"
verifiedAt: "2026-02-01T16:00:00.000Z"
timesReused: 0
---

# Cancel Booking

## Summary
Cancels an existing booking (appointment or event registration). This endpoint requires a valid `booking_id` which must be obtained from other endpoints.

## Authentication
Available for **Staff, App, Directory, and Client tokens**.

## How to Obtain booking_id

The `booking_id` can be obtained from multiple sources:

### Option 1: From Appointments List (Recommended for Staff/App tokens)
Use `GET /platform/v1/scheduling/appointments` to get a list of appointments. The `id` field in each appointment is the `booking_id`.

```yaml
steps:
  - id: get_appointments
    description: "Get appointments to find a booking_id"
    method: GET
    path: "/platform/v1/scheduling/appointments"
    token: staff
    params:
      business_id: "{{business_id}}"
      state: "scheduled"
      per_page: 10
    extract:
      booking_id: "$.data.appointments[0].id"
    expect:
      status: [200]
```

### Option 2: From Bookings List (Client token only)
Use `GET /platform/v1/scheduling/bookings` with a **Client token** to get the client's bookings. The `uid` field is the `booking_id`.

```yaml
steps:
  - id: get_bookings
    description: "Get client bookings (requires client token)"
    method: GET
    path: "/platform/v1/scheduling/bookings"
    token: client
    params:
      business_id: "{{business_id}}"
      per_page: 10
      offset: 0
    extract:
      booking_id: "$.data.bookings[0].uid"
    expect:
      status: [200]
```

### Option 3: From Create Booking Response
When you create a booking via `POST /platform/v1/scheduling/bookings`, the response contains `data.booking.id` which is the `booking_id`.

## Prerequisites

```yaml
steps:
  - id: get_booking_id
    description: "Get a scheduled appointment to cancel"
    method: GET
    path: "/platform/v1/scheduling/appointments"
    token: staff
    params:
      business_id: "{{business_id}}"
      state: "scheduled"
      per_page: 1
    extract:
      booking_id: "$.data.appointments[0].id"
    expect:
      status: [200]
    onFail: skip
    skipReason: "No scheduled appointments available to cancel"
```

## Test Request

```yaml
steps:
  - id: cancel_booking
    method: POST
    path: "/platform/v1/scheduling/bookings/cancel"
    token: staff
    body:
      business_id: "{{business_id}}"
      booking_id: "{{booking_id}}"
    expect:
      status: [200]
```

## Request Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `business_id` | Yes | string | The business UID |
| `booking_id` | Yes | string | The booking/appointment UID to cancel |
| `event_instance_id` | Conditional | string | Required only when cancelling an event registration (not an appointment) |

## Expected Response

```json
{
  "data": {
    "booking": {
      "id": "q85mz0l11b7e0u2j",
      "status": "cancelled",
      "title": "Service Name",
      "client_id": "i1srcak1820zi7yr",
      "staff_id": "652fe81f2e369b1b",
      "business_id": "2a244fc4f6edcad7",
      "start_time": "2025-08-07T01:56:21.059-05:00",
      "duration": 60,
      "time_zone": "UTC",
      "type": "appointment/event"
    }
  },
  "status": "OK"
}
```

## Error Responses

### 400 Bad Request - Missing booking_id
```json
{
  "status": "Error",
  "error": "Mandatory parameter booking_id is missing",
  "error_code": "PARAMETER_MISSING"
}
```

### 404 Not Found - Invalid booking_id
```json
{
  "status": "Error",
  "error": "Booking not found",
  "error_code": "NOT_FOUND"
}
```

## Known Issues

- **GET /platform/v1/scheduling/bookings returns 401 with Staff token**: This endpoint only accepts Client tokens. Use `GET /platform/v1/scheduling/appointments` with Staff/App tokens instead to get booking IDs.
- **Event cancellation requires event_instance_id**: When cancelling an event registration, you must provide the `event_instance_id`. For regular appointments, this field is not needed.

## Alternative: Use Appointments Endpoint

For staff/app token flows, it's easier to use the appointments endpoint to get booking IDs:

```yaml
steps:
  - id: get_appointments
    method: GET
    path: "/platform/v1/scheduling/appointments"
    token: staff
    params:
      business_id: "{{business_id}}"
      state: "scheduled"
    extract:
      booking_id: "$.data.appointments[0].id"
    expect:
      status: [200]

  - id: cancel_booking
    method: POST
    path: "/platform/v1/scheduling/bookings/cancel"
    token: staff
    body:
      business_id: "{{business_id}}"
      booking_id: "{{booking_id}}"
    expect:
      status: [200]
```
