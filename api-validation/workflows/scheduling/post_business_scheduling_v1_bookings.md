---
endpoint: "POST /business/scheduling/v1/bookings"
domain: scheduling
tags: [scheduling, bookings]
swagger: "swagger/scheduling/legacy/scheduling.json"
status: verified
savedAt: "2026-02-03T18:27:27.807Z"
verifiedAt: "2026-02-03T18:27:27.807Z"
timesReused: 0
tokens: [staff]
useFallbackApi: true
notes: "Requires Staff token with pre-configured client_id. Directory tokens require business to be in the directory."
---

# Create Booking

## Summary

Creates a new booking (appointment or event registration) for a business.
This endpoint uses an existing client ID to create bookings.

**Important**: Always provide a `client_id` parameter. Without it, the endpoint attempts to create a client from `form_data`, which returns "First name can't be blank" errors.

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
```

## Test Request

```yaml
steps:
  - id: create_booking
    description: "Create a new booking for an existing client"
    method: POST
    path: "/business/scheduling/v1/bookings"
    token: staff
    body:
      business_id: "{{business_id}}"
      service_id: "{{service_id}}"
      staff_id: "{{staff_id}}"
      start_time: "{{future_datetime}}"
      client_id: "{{client_id}}"
    expect:
      status: [200, 201]
```

## Authentication

- **Staff tokens**: Recommended. Requires the staff member to belong to the same business as the client. Works when `client_id` is provided for a client in the staff's business.
- **Directory tokens**: Requires the business to be a member of the directory (via `directory_member`). Will return 422 Unauthorized if business is not in the directory.
- **Application tokens**: May work depending on OAuth configuration.

## Authorization Logic

The backend authorization checks differ by token type:

### Staff Token (`user` type)
From `bookings_api.rb`:
```ruby
user = User.find(authorize_params[:id])
client = Client.find_by_uid(action_params[:client_uid])
authorized = (user.staff.business.uid == client.business.uid)
```
**Requirement**: Staff's business must match client's business.

### Directory Token (`directory` type)
From `clients_api.rb`:
```ruby
business = Business.find_by_uid(action_params[:business_uid])
authorized = business.directory_member.present? && 
             business.directory_member.directory_id == authorize_params[:id]
```
**Requirement**: Business must have a `directory_member` belonging to the directory token's directory.

## Parameters Reference

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| business_id | string | Yes | Business uid |
| service_id | string | Yes | Service uid (must be AppointmentService) |
| staff_id | string | Yes | Staff uid who will provide the service |
| start_time | string | Yes | ISO 8601 datetime (must be in future) |
| client_id | string | Yes | Existing client uid that belongs to the same business |

## Expected Response (200/201)

```json
{
  "status": "OK",
  "data": {
    "booking": {
      "id": "booking_uid",
      "title": "Service Name",
      "status": "scheduled",
      "start_time": "2026-02-15T10:00:00Z",
      "duration": 30,
      "client_id": "client_uid",
      "staff_id": "staff_uid",
      "business_id": "business_uid",
      "service_id": "service_uid",
      "type": "appointment",
      "time_zone": "UTC"
    }
  }
}
```

## Error Responses

### 400 - Parameter Missing

```json
{
  "status": "Error",
  "error": "Mandatory parameter service_id is missing",
  "error_code": "PARAMETER_MISSING"
}
```

### 422 - Unauthorized

```json
{
  "status": "Error",
  "error": "Unauthorized"
}
```

This error occurs when:
- **Staff token**: Staff's business doesn't match client's business
- **Directory token**: Business is not a member of the directory (no `directory_member` record linking business to directory)

**Fix for Staff tokens:** Ensure `client_id` is for a client that belongs to the same business as the staff member.
**Fix for Directory tokens:** Ensure the business has a `directory_member` record for the directory associated with the token.

### 422 - Validation Failed

```json
{
  "status": "Error",
  "error": "Validation failed: First name can't be blank"
}
```

This error occurs when `client_id` is not provided and the API attempts to create a client from `form_data`. Always provide `client_id` with an existing client.

## Known Issues

### Issue: /form_data

**Description**: form_data.fields has internal FieldsAPI authorization issues - use client_id instead

### Issue: Directory tokens without directory_member

**Description**: Directory tokens require the business to have a directory_member record linking it to the directory. Returns 422 Unauthorized otherwise.

## Notes

- **ALWAYS provide `client_id`** - Without it, the API attempts client creation and fails with "First name can't be blank"
- **Use Staff tokens** - Staff tokens work when client belongs to the same business as the staff
- **Directory tokens limitation** - Only work when business is a member of the directory (has directory_member record)
- `start_time` must be in the future and the timeslot must be available
- The `client_id` must be an existing client for this business

## Setup Requirements1. Ensure you have a valid Staff token configured in `api-validation/config/tokens.json`
2. Ensure `client_id` in tokens.json is for a client belonging to the same business as the staff
3. The `business_id`, `staff_id`, and `client_id` must all be for the same business