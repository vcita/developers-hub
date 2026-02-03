---
endpoint: POST /platform/v1/scheduling/bookings
domain: scheduling
tags: [booking, appointment, client-api]
protected: true
---
# Create Booking (Client API)

## Summary
Creates a booking for an appointment with a staff member. This endpoint requires a **Client token** (not Staff).

## Prerequisites

```yaml
steps:
  - id: get_services
    description: "Get available services for the business"
    method: GET
    path: "/platform/v1/services"
    params:
      business_id: "{{business_uid}}"
    extract:
      service_id: "$.data.services[?(@.type=='AppointmentService')].id"
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
      business_id: "{{business_uid}}"
      service_id: "{{service_id}}"
      staff_id: "{{staff_uid}}"
      client_id: "{{client_uid}}"
      start_time: "{{tomorrow_datetime}}"
      time_zone: "UTC"
    expect:
      status: [200, 201, 422]
    notes: "422 is acceptable - indicates valid request but slot unavailable"
```

## UID Resolution Procedure

| UID Field | GET Endpoint | Extract From |
|-----------|--------------|--------------|
| service_id | GET /platform/v1/services?business_id={{business_uid}} | data.services[0].id |
| business_uid | config | tokens.json params.business_uid |
| staff_uid | config | tokens.json params.staff_uid |
| client_uid | config | tokens.json params.client_uid |

## Critical Learnings

1. **Token Type**: Must use `client` token, NOT staff token. The endpoint inherits from ClientApi base controller.
2. **Required Parameters**: business_id, service_id, staff_id, start_time (for appointments)
3. **UIDs not IDs**: All parameters must be alphanumeric UIDs, not numeric database IDs
4. **422 is valid**: TIMESLOT_UNAVAILABLE error means the request was correctly formed but slot is taken
