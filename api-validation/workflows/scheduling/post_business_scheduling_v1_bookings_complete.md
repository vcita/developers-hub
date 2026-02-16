---
endpoint: "POST /business/scheduling/v1/bookings/complete"
domain: scheduling
tags: [scheduling, bookings]
swagger: "swagger/scheduling/legacy/scheduling.json"
status: verified
savedAt: "2026-02-01T23:30:00.000Z"
verifiedAt: "2026-02-01T23:30:00.000Z"
timesReused: 0
useFallbackApi: true
---

# Complete Booking

## Summary
Complete a pending booking (appointment or event registration).

**Token Type**: Requires a **staff token**.

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
    description: "Create a booking to complete"
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
  - id: complete_booking
    method: POST
    path: "/business/scheduling/v1/bookings/complete"
    token: staff
    body:
      booking_id: "{{booking_id}}"
      business_id: "{{business_id}}"
    expect:
      status: [200, 201]
```

## Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `booking_id` | Yes* | string or array | Booking UID(s). Can be single string or array for batch operations (max 50). |
| `event_instance_id` | Yes* | string | Event instance UID. Required when completing event registrations. |
| `business_id` | Yes | string | Business UID |

*One of `booking_id` or `event_instance_id` is required.

## Expected Response (200/201)

```json
{
  "status": "OK",
  "data": {
    "booking": {
      "uid": "v8mvcenb8y3wej2n",
      "status": "completed"
    }
  }
}
```

## Error Responses

### 400 - Missing Parameters
```json
{
  "status": "Error",
  "error": "Missing required parameter: booking_id or event_instance_id"
}
```

### 404 - Booking Not Found
```json
{
  "status": "Error",
  "error": "Booking not found"
}
```

## Notes

- **Batch operations**: Support up to 50 bookings at once using an array of IDs
- **Event completion**: Use `event_instance_id` for completing all attendances of an event
- The booking must be in a valid state to be completed (e.g., 'scheduled')