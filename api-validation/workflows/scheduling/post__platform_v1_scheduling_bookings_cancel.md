# POST /platform/v1/scheduling/bookings/cancel

## Overview
Cancel a booking (appointment or event registration).

## Authentication
- **Token Type:** Client token only
- **Header:** `Authorization: Bearer <client_token>`

## Prerequisites

Before calling this endpoint, you need:

1. **Client Token** - Obtained via client authentication flow
2. **business_id** - The business UID where the booking exists
3. **booking_id** - The booking UID to cancel. Can be obtained from:
   - `GET /platform/v1/scheduling/bookings` response (`data.booking.id`)
   - `GET /platform/v1/scheduling/appointments` response (`id` field)
   - Response from `POST /platform/v1/scheduling/bookings` (`data.booking.id`)

## Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `business_id` | string | Yes | Business UID |
| `booking_id` | string | Yes | Booking UID to cancel |
| `event_instance_id` | string | No | Event instance UID. When provided, booking is treated as an event cancellation |
| `message` | string | No | Optional cancellation message to send to the business/staff |

## Example Request

### Cancel an Appointment
```bash
curl -X POST "https://api.vcita.biz/platform/v1/scheduling/bookings/cancel" \
  -H "Authorization: Bearer <client_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "2a244fc4f6edcad7",
    "booking_id": "q85mz0l11b7e0u2j"
  }'
```

### Cancel an Event Registration
```bash
curl -X POST "https://api.vcita.biz/platform/v1/scheduling/bookings/cancel" \
  -H "Authorization: Bearer <client_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "2a244fc4f6edcad7",
    "booking_id": "q85mz0l11b7e0u2j",
    "event_instance_id": "a8ma2ephjfvwnvy7"
  }'
```

### Cancel with Message
```bash
curl -X POST "https://api.vcita.biz/platform/v1/scheduling/bookings/cancel" \
  -H "Authorization: Bearer <client_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "2a244fc4f6edcad7",
    "booking_id": "q85mz0l11b7e0u2j",
    "message": "I need to reschedule due to a conflict"
  }'
```

## Response Codes

| Code | Description |
|------|-------------|
| 200 | Booking cancelled successfully |
| 400 | Missing required parameters (`PARAMETER_MISSING`) |
| 403 | Cancellation failed (e.g., booking cannot be cancelled) |

## Example Response (200)
```json
{
  "status": "OK",
  "data": {
    "booking": {
      "id": "q85mz0l11b7e0u2j",
      "business_id": "2a244fc4f6edcad7",
      "client_id": "i1srcak1820zi7yr",
      "conversation_id": "lcfnf1pag6itpwlf",
      "created_at": "2020-01-19T07:44:21Z",
      "duration": 60,
      "staff_id": "652fe81f2e369b1b",
      "start_time": "2025-08-07T01:56:21.059-05:00",
      "status": "cancelled",
      "time_zone": "UTC",
      "title": "Consultation",
      "type": "appointment"
    }
  }
}
```

## Example Error Response (400)
```json
{
  "status": "Error",
  "error": "Mandatory parameter business_id is missing",
  "error_code": "PARAMETER_MISSING"
}
```

## Implementation Details

- **Controller:** `Platform::V1::Scheduling::BookingsController#cancel`
- **File:** `modules/scheduling/app/controllers/platform/v1/scheduling/bookings_controller.rb:209-223`
- **Route:** `modules/scheduling/app/config/routes/scheduling_routes.rb:64`
- **Booking Type Detection:** If `event_instance_id` is provided, treated as 'event', otherwise 'appointment'
- **Cancellation Initiator:** Always set to 'client' for this endpoint

## Notes

- This endpoint is specifically for client-initiated cancellations
- The client must have a valid token associated with the booking they're cancelling
- The `message` parameter allows clients to communicate the reason for cancellation
