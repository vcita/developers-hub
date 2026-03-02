---
endpoint: "POST /business/scheduling/v1/bookings/accept"
domain: scheduling
tags: [booking, accept, scheduling]
swagger: "swagger/scheduling/legacy/scheduling.json"
status: pending
savedAt: "2026-03-02T12:00:00.000Z"
timesReused: 0
tokens: [staff]
useFallbackApi: true
---

# Accept Booking

## Summary
Accept a booking (appointment or event registration) that is awaiting business approval. Supports both single booking acceptance (returns 201) and batch acceptance via an array of booking IDs (returns 200).

For single acceptance, the booking must be in `requested` or `reschedule` state. The batch format always returns HTTP 200 with per-booking success/failure details.

**Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required

## Prerequisites

```yaml
steps:
  - id: get_aligned_ids
    description: "Get aligned service_id and staff_id from an existing appointment"
    method: GET
    path: "/platform/v1/scheduling/appointments"
    params:
      business_id: "{{business_id}}"
      per_page: 1
    extract:
      aligned_service_id: "$.data.appointments[0].service_id"
      aligned_staff_id: "$.data.appointments[0].staff_id"
    expect:
      status: [200]
    onFail: abort

  - id: create_booking
    description: "Create a booking via staff token (bypasses availability check)"
    method: POST
    path: "/business/scheduling/v1/bookings"
    token: staff
    body:
      business_id: "{{business_id}}"
      service_id: "{{aligned_service_id}}"
      staff_id: "{{aligned_staff_id}}"
      client_id: "{{client_id}}"
      start_time: "{{future_datetime_48h}}"
      time_zone: "UTC"
    extract:
      booking_id: "$.data.booking.id"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: accept_booking_batch
    description: "Accept booking using batch format (always returns 200)"
    method: POST
    path: "/business/scheduling/v1/bookings/accept"
    token: staff
    body:
      business_id: "{{business_id}}"
      booking_id:
        - "{{booking_id}}"
    expect:
      status: [200]
```

## Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `business_id` | Yes | string | Business UID |
| `booking_id` | Yes | string or array | Booking UID(s). Can be a single string (returns 201 on success) or an array for batch operations (max 50, always returns 200). For single acceptance, booking must be in `requested` or `reschedule` state. |
| `event_instance_id` | Conditional | string | Required when accepting an event registration (not appointment) |
| `message` | No | string | Optional message to include with the acceptance notification |

## Expected Response - Single Accept (201)

```json
{
  "status": "OK",
  "data": {
    "booking": {
      "id": "xgnm9g2ysine1e5b",
      "state": "scheduled",
      "title": "Appointment",
      "start_time": "2025-08-07T09:55:52.773+03:00",
      "no_show": false
    }
  }
}
```

## Expected Response - Batch Accept (200)

```json
{
  "status": "OK",
  "data": {
    "batch_response": [
      {
        "id": "0or7alzpb99ye3lo",
        "success": true,
        "error": null
      }
    ]
  }
}
```

When a booking cannot be accepted (e.g., already in `scheduled` state), the batch response includes per-item errors:

```json
{
  "status": "OK",
  "data": {
    "batch_response": [
      {
        "id": "j01duykdytfdzh7d",
        "success": false,
        "error": "Bad Transition"
      }
    ]
  }
}
```

## Error Responses

### 400 Bad Request - Missing Parameters
```json
{
  "status": "Error",
  "error": "Mandatory parameter booking_id is missing",
  "error_code": "PARAMETER_MISSING"
}
```

### 400 Bad Request - Bad Transition (single accept only)
```json
{
  "status": "Error",
  "error": "Bad Transition"
}
```
Returned when attempting to accept a single booking that is not in `requested` or `reschedule` state (e.g., already `scheduled` or `cancelled`).

### 400 Bad Request - Unauthorized
```json
{
  "status": "Error",
  "error": "Unauthorized"
}
```
Returned when the staff token doesn't have permission for the booking's business.

## Known Issues

- **Gateway routing**: This endpoint returns `{"status":"Error","error":"Unauthorized"}` when called through APIGW with a staff token. Use `useFallbackApi: true` to route directly to core.
- **Availability microservice dependency**: Creating a booking in `requested` state requires a client-initiated booking, which requires the Availability microservice to return available slots. In test environments where the Availability microservice is not configured, client bookings fail with `TIMESLOT_UNAVAILABLE`. The workflow uses the batch format as a workaround.
- **Booking state requirements**: Single accept (string `booking_id`) requires the booking to be in `requested` or `reschedule` state. Staff-created bookings bypass approval and go directly to `scheduled` state, which cannot be accepted. Only client-initiated bookings with `approval_mode != "immediate"` enter `requested` state.

## Notes

- The frontend (Vue `bookingBulkActionService.js`) calls this endpoint via `POST /business/scheduling/v1/bookings/accept` with `business_id` and `booking_id` (or array).
- The legacy Angular flow uses `PUT /api/v2/appointments/{uid}/perform` with `operation: 'accept'` instead.
- The batch format (`booking_id` as array) always returns HTTP 200, even if individual bookings fail. This is by design for bulk operations.
