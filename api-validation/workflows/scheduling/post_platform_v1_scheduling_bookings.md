---
endpoint: "POST /platform/v1/scheduling/bookings"
domain: scheduling
tags: [booking, appointment, scheduling, platform]
swagger: swagger/scheduling/legacy/legacy_v1_scheduling.json
status: pending
savedAt: 2026-02-01T14:30:00.000Z
verifiedAt: 2026-02-01T14:30:00.000Z
useFallbackApi: true
---

# Create Booking

## Summary
Create a booking for an appointment with a staff member. This endpoint requires a **client token** to bypass form validation - using a staff token will result in FORM_VALIDATION_ERROR even with `client_id` provided.

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
      status: 200
    onFail: abort

  - id: get_staffs
    description: "Get staff members for the business"
    method: GET
    path: "/platform/v1/businesses/{{business_id}}/staffs"
    extract:
      staff_id: "$.data.staff[0].id"
    expect:
      status: 200
    onFail: abort

  - id: get_availability
    description: "Verify availability exists for the service (we use tomorrow_datetime directly)"
    method: GET
    path: "/platform/v1/services/availability"
    params:
      business_id: "{{business_id}}"
      id: "{{service_id}}"
      staff_id: "{{staff_id}}"
      start_date: "{{tomorrow_date}}"
      end_date: "{{next_week_date}}"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: create_booking
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
          notes: "API test booking"
        policies: {}
    expect:
      status: [200, 201]
```

## Successful Example

This is a verified working request captured from production:

**Token Type**: Client JWT token (the authenticated client must match `client_id`)

**Request Body**:
```json
{
  "business_id": "0ka5ubzrwi7qizsx",
  "staff_id": "78yxk50d6me4q5ql",
  "time_zone": "Asia/Jerusalem",
  "service_id": "r5e4r84kr4z4scpa",
  "start_time": "2026-02-03T07:00:00.000Z",
  "form_data": {
    "fields": {},
    "service_fields": {},
    "others": {"notes": "test"},
    "policies": {}
  },
  "client_id": "tqyv46ory3norf6i",
  "booking_type": "appointment"
}
```

**Key observations**:
- Uses **client token** (type: "client" in JWT payload)
- `client_id` in body MUST match `entity_uid` in the JWT token
- `form_data.fields` can be an **empty object `{}`** (not array) when `client_id` is provided
- `booking_type: "appointment"` is included
- No `portal_id` or `source_name` required

## Known Issues

- **422 Unauthorized with staff token**: Staff tokens created via directory token may lack scheduling permissions. This is a backend permission configuration issue.
- **form_data structure is an array**: If `form_data` is needed (when `client_id` is not provided), `fields` must be an ARRAY of objects like `[{"field_id": "xxx", "new_data": "value"}]`, NOT a key-value object.
- **Prefer client_id**: When `client_id` is provided, form validation is bypassed for client identification. This is the simplest approach for testing.
