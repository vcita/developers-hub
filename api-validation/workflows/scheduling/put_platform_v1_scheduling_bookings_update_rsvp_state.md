---
endpoint: "PUT /platform/v1/scheduling/bookings/{booking_uid}/update_rsvp_state"
domain: scheduling
tags: [scheduling, bookings, rsvp]
swagger: "swagger/scheduling/legacy/legacy_v1_scheduling.json"
status: verified
savedAt: "2026-02-01T23:30:00.000Z"
verifiedAt: "2026-02-01T23:30:00.000Z"
timesReused: 0
---

# Update RSVP State

## Summary
Update the RSVP state for a booking.

## Authentication
Available for **Client tokens** only. Staff tokens will receive 401 Unauthorized.

## Prerequisites

```yaml
steps:
  - id: create_booking
    description: "Create a booking to update RSVP state"
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
      booking_uid: "$.data.booking.id"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: update_rsvp_state
    method: PUT
    path: "/platform/v1/scheduling/bookings/{{booking_uid}}/update_rsvp_state"
    token: client
    body:
      new_rsvp_state: "confirmed"
      business_id: "{{business_id}}"
      appointment_type: "appointment"
    expect:
      status: [200]
```

## Path Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `booking_uid` | Yes | string | The booking UID |

## Query Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `new_rsvp_state` | Yes | string | Valid values: 'confirmed', 'cancelled', 'pending' |

## Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `business_id` | Yes | string | Business UID |
| `appointment_type` | Yes | string | Type: 'appointment', 'event_instance', or 'event_attendance' |

## Expected Response (200)

```json
{
  "status": "OK",
  "data": {
    "booking": {
      "uid": "g90kratlmu1n9w9i",
      "rsvp_state": "confirmed",
      "type": "appointment"
    }
  }
}
```

## Error Responses

### 400 - Missing Parameters
```json
{
  "status": "Error",
  "error": "Missing required parameters"
}
```

### 401 - Unauthorized (non-Client token)
```json
{
  "error": "Unauthorized"
}
```

### 403 - Invalid RSVP State
```json
{
  "status": "Error",
  "error": "Invalid RSVP state"
}
```

## Notes

- **Client token required**: Only Client tokens can update RSVP state
- **Valid RSVP states**: 'confirmed', 'cancelled', 'pending'
- The booking must belong to the client making the request
