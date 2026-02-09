---
endpoint: "PUT /business/scheduling/v1/bookings/cancel"
domain: scheduling
tags: [booking, cancel, scheduling]
swagger: swagger/scheduling/legacy/scheduling.json
status: pending
savedAt: 2026-02-01T21:00:00.000Z
---

# Cancel Booking (Business API)

## Summary
Cancel an existing booking. The booking should be in "scheduled" or "pending" state.

## Authentication
Available for **Staff and App tokens**.

## Prerequisites

Get a scheduled booking to cancel:

```yaml
steps:
  - id: get_scheduled_appointments
    description: "Get appointments in scheduled state"
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
      status: 200
    onFail: skip
    skipReason: "No scheduled appointments available to cancel"
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

## Request Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `business_id` | Yes | string | The business UID |
| `booking_id` | Yes | string or array | The booking UID(s) to cancel. Can be a single string or array for batch operations (max 50) |
| `event_instance_id` | Conditional | string | Required when cancelling an event registration (not appointment) |
| `message` | No | string | Optional message to include with the cancellation notification |
| `cancel_payment` | No | boolean | Set to true to cancel any associated payment |
| `issue_refund` | No | boolean | Set to true to issue a refund for the cancelled booking |

## Expected Response (201)

```json
{
  "status": "OK",
  "data": {
    "booking": {
      "id": "93vcpp7i9d5wowo0",
      "business_id": "6c52c83af92a7819",
      "client_id": "7n8ia1nmvuhqqn9g",
      "conversation_id": "qy0eddp9i3igw3ko",
      "staff_id": "f5fd126aa3d298be",
      "status": "cancelled",
      "title": "Service Name",
      "start_time": "2025-08-07T09:55:54.048+03:00",
      "duration": 60,
      "time_zone": "UTC",
      "type": "appointment"
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
        "id": "1a2h20dwb6iakgqk",
        "success": true
      }
    ]
  }
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

### 404 Not Found
```json
{
  "status": "Error",
  "error": "Booking not found"
}
```

## Known Issues

- **booking_id type**: Schema allows both string (single) and array (batch). Use array format for batch cancellations.
- **Response code**: Returns 201 for single cancel, 200 for batch.

## How to Get booking_id

The `booking_id` can be obtained from:
1. **GET /platform/v1/scheduling/appointments** - The `id` field in each appointment
2. **POST /business/scheduling/v1/bookings** response - The `data.booking.id` field
