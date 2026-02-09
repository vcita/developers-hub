---
endpoint: "POST /business/scheduling/v1/bookings/accept"
domain: scheduling
tags: [booking, accept, scheduling]
swagger: "swagger/scheduling/legacy/scheduling.json"
status: pending
savedAt: "2026-02-01T21:00:00.000Z"
timesReused: 0
---

# Accept Booking

## Summary
Accept a booking (appointment or event registration) that is awaiting business approval. The booking must be in one of the following states to be accepted: `requested`, `invited`, `reschedule`, or `proposed_time`.

## Authentication
Available for **Staff and App tokens**.

## State Machine Context

According to the Meeting state machine, the `accept` event can only transition from these states:
- `requested` - Client has requested a meeting
- `invited` - Business has invited a client
- `reschedule` - Client has requested a reschedule
- `proposed_time` - Business has proposed a time

All these states transition to `scheduled` upon acceptance.

**Note**: There is no "pending" state in the system. The documentation uses "pending" as a general term, but the actual API uses `requested` as the primary state for bookings awaiting acceptance.

## Test Prerequisites

This endpoint requires a booking in `requested` state. Client-initiated bookings via `/platform/v1/scheduling/bookings` with a **client token** create bookings in `requested` state (when `approval_mode != 'immediate'`).

## Prerequisites

```yaml
steps:
  - id: get_services
    description: "Get available services for the business"
    method: GET
    path: "/platform/v1/services"
    token: staff
    params:
      business_id: "{{business_id}}"
    extract:
      service_id: "$.data.services[0].id"
    expect:
      status: [200]
    onFail: stop

  - id: get_staffs
    description: "Get staff members for the business"
    method: GET
    path: "/platform/v1/businesses/{{business_id}}/staffs"
    token: staff
    extract:
      staff_id: "$.data.staff[0].id"
    expect:
      status: [200]
    onFail: stop
```

## Test Request

```yaml
steps:
  # Step 1: Create a client-initiated booking (will go to 'requested' state)
  - id: create_client_booking
    description: "Create a booking using client token (goes to requested state)"
    method: POST
    path: "/platform/v1/scheduling/bookings"
    token: client
    body:
      business_id: "{{business_id}}"
      service_id: "{{service_id}}"
      staff_id: "{{staff_id}}"
      client_id: "{{client_id}}"
      start_time: "{{tomorrow_datetime}}"
      time_zone: "UTC"
      booking_type: "appointment"
      form_data:
        fields: {}
        service_fields: {}
        others:
          notes: "Test booking for accept endpoint"
        policies: {}
    extract:
      booking_id: "$.data.booking.id"
      booking_state: "$.data.booking.state"
    expect:
      status: [200, 201]
    onFail: stop

  # Step 2: Accept the booking (THE ACTUAL TEST)
  - id: accept_booking
    description: "Accept the booking using staff token"
    method: POST
    path: "/business/scheduling/v1/bookings/accept"
    token: staff
    body:
      business_id: "{{business_id}}"
      booking_id: "{{booking_id}}"
    expect:
      status: [200, 201]
      body:
        - path: "$.data.booking.state"
          value: "scheduled"
    onFail: stop
```

## Notes

- **Client token required for booking creation**: The `/platform/v1/scheduling/bookings` endpoint must use a client token to create bookings that go to `requested` state. Staff-created bookings bypass approval.
- **Pre-configured variables**: Uses `{{service_id}}`, `{{staff_id}}`, `{{client_id}}` from tokens.json configuration.
- **Business approval_mode**: If the business has `approval_mode: immediate`, the booking may be auto-accepted. Most test environments have `approval_mode: multiple_choice` by default which requires approval.

## Request Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `business_id` | Yes | string | The business UID |
| `booking_id` | Yes | string | The booking UID to accept. Can be a single string or array for batch operations (max 50). Booking must be in `requested`, `invited`, `reschedule`, or `proposed_time` state. |
| `event_instance_id` | Conditional | string | Required when accepting an event registration (not appointment) |
| `message` | No | string | Optional message to include with the acceptance notification |

## Expected Response (201)

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

## Batch Response (200)

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

## Error Responses

### 400 Bad Request - Unauthorized
```json
{
  "status": "Error",
  "error": "Unauthorized"
}
```
This occurs when the staff token doesn't have permission for the booking.

### 400 Bad Request - Missing booking_id
```json
{
  "status": "Error",
  "error": "Mandatory parameter booking_id is missing",
  "error_code": "PARAMETER_MISSING"
}
```

### 422 - Booking Not in Acceptable State
```json
{
  "status": "Error",
  "error": "Booking is not in a valid state for acceptance"
}
```
This occurs when the booking is in a state that cannot transition via `accept` (e.g., `scheduled`, `cancelled`, `done`, etc.).

## Known Issues

- **No bookings in acceptable states**: Most businesses have services with `approval_mode: "immediate"` which auto-accepts bookings. To test this endpoint, you need a service configured with `approval_mode: "single_choice"` or `"multiple_choice"`.
- **400 Unauthorized**: Returns 400 (not 401/403) when staff lacks permission for the booking.
- **State terminology**: Documentation sometimes uses "pending" generically, but the actual system state is `requested` (or `invited`, `reschedule`, `proposed_time`).

## Valid States for Accept

| Current State | Can Accept? | Notes |
|---------------|-------------|-------|
| `requested` | Yes | Primary state for client-requested bookings |
| `invited` | Yes | Business invited a client |
| `reschedule` | Yes | Client requested a reschedule |
| `proposed_time` | Yes | Business proposed a time |
| `scheduled` | No | Already accepted |
| `cancelled` | No | Booking was cancelled |
| `done` | No | Booking is complete |
| `created` | No | Initial state, not yet requested |

## How to Get booking_id

The `booking_id` can be obtained from:
1. **GET /platform/v1/scheduling/appointments** - Use `state=requested` filter (or `invited`, `reschedule`, `proposed_time`), the `id` field is the booking_id
2. **POST /business/scheduling/v1/bookings** response - The `data.booking.id` field
