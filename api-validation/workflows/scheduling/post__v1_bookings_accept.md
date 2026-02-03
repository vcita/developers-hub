---
endpoint: "POST /v1/bookings/accept"
internal_path: "/business/scheduling/v1/bookings/accept"
domain: scheduling
tags: [booking, accept, scheduling]
swagger: swagger/scheduling/legacy/scheduling.json
status: verified
savedAt: 2026-02-02T12:00:00.000Z
---

# Accept Booking

## Summary

Accept a pending booking (appointment or event registration) that is awaiting business approval. This endpoint is exposed as `/v1/bookings/accept` via Kong proxy, which routes to the internal path `/business/scheduling/v1/bookings/accept`.

## Authentication

**Token types:** Staff and App tokens

The endpoint uses the `APIController` authorization which validates:
- `user` (Staff token) - must belong to the business
- `app` (App token) - must belong to the same directory as the business
- `directory` token
- `admin` token

## Implementation Details

**Controller:** `Business::Scheduling::V1::BookingsController#accept`
**Location:** `modules/scheduling/app/controllers/business/scheduling/v1/bookings_controller.rb:97-128`

**Route:** `modules/scheduling/app/config/routes/scheduling_routes.rb:10`
```ruby
post :accept, on: :collection
```

## Request Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `business_id` | Yes | string | The business UID |
| `booking_id` | Yes | string or array | Booking UID(s) to accept. Single string for one booking, or array of strings for batch operations (max 50) |
| `event_instance_id` | Conditional | string | Required when accepting an event registration instead of an appointment |
| `message` | No | string | Optional message to include with the acceptance notification |

## Batch Operations

Supports batch operations by providing an array of booking IDs:
- Maximum 50 bookings per request
- Returns 403 error if more than 50 bookings provided
- Response format differs for batch vs single booking

## State Machine

Bookings must be in one of these states to be accepted:
- `requested` - Client has requested a meeting
- `invited` - Business has invited a client
- `reschedule` - Client has requested a reschedule
- `proposed_time` - Business has proposed a time

All these states transition to `scheduled` upon acceptance.

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
      status: 200
    onFail: stop

  - id: get_staffs
    description: "Get staff members for the business"
    method: GET
    path: "/platform/v1/businesses/{{business_id}}/staffs"
    token: staff
    extract:
      staff_id: "$.data.staff[0].id"
    expect:
      status: 200
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
    extract:
      booking_id: "$.data.booking.id"
    expect:
      status: [200, 201]
    onFail: stop

  # Step 2: Accept the booking
  - id: accept_booking
    description: "Accept the booking using staff/app token"
    method: POST
    path: "/v1/bookings/accept"
    token: staff
    body:
      business_id: "{{business_id}}"
      booking_id: "{{booking_id}}"
    expect:
      status: [200, 201]
      body:
        - path: "$.data.booking.state"
          value: "scheduled"
```

## Response Codes

### 201 - Booking Accepted (single booking)

```json
{
  "status": "OK",
  "data": {
    "booking": {
      "id": "xgnm9g2ysine1e5b",
      "state": "scheduled",
      "title": "Appointment",
      "start_time": "2025-08-07T09:55:52.773+03:00"
    }
  }
}
```

### 200 - Batch Response

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

### 400 - Missing Required Parameters

```json
{
  "status": "Error",
  "error": "Mandatory parameter booking_id is missing",
  "error_code": "PARAMETER_MISSING"
}
```

### 400 - Booking Error

Returned when the booking operation fails (e.g., invalid state transition).

```json
{
  "status": "Error",
  "error": "Booking is not in a valid state for acceptance"
}
```

### 403 - Too Many Bookings

```json
{
  "status": "Error",
  "error": "Too many bookings"
}
```

### 403 - Generic Error

```json
{
  "status": "Error",
  "error": "<error message>"
}
```

## Code References

- **Controller:** `modules/scheduling/app/controllers/business/scheduling/v1/bookings_controller.rb:97-128`
- **Routes:** `modules/scheduling/app/config/routes/scheduling_routes.rb:10`
- **Parameter validation:** `modules/scheduling/app/controllers/platform/v1/scheduling/bookings_controller.rb:326-331`
- **BookingsAPI:** `modules/scheduling/app/components/bookings_api.rb`

## Notes

- The `/v1/bookings/accept` path is the external Kong proxy path
- Internally routed to `/business/scheduling/v1/bookings/accept`
- For event registrations, provide `event_instance_id` to switch booking_type to 'event'
- The `initiator` is always set to 'business' for this endpoint
