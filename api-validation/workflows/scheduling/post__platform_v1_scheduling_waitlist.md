# POST /platform/v1/scheduling/waitlist

## Overview
Join an event waitlist.

## Authentication
- **Token Types**: Staff, App, Directory, and Client tokens
- **Base Controller**: `Api::ClientApi::V1::BaseController`
- **Auth Module**: `Api::ClientAuthentication`

## Client Identification
- **Client tokens**: The client is identified from the token
- **Staff/App/Directory tokens**: Must provide `client_id` to identify which client to add

## Parameters

### Required Body Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `business_id` | string | Business UID (validated at controller level) |
| `event_instance_id` | string | Event instance UID (validated at API layer) |

### Optional Body Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `client_id` | string | Client UID (required for Staff/App/Directory tokens) |
| `matter_uid` | string | Matter/conversation UID to associate |
| `time_zone` | string | Time zone for the waitlist entry |
| `source_name` | string | Source name for tracking |
| `source_url` | string | Source URL for tracking |
| `channel` | string | Source channel for tracking |
| `form_data` | object | Custom form field data |

## Prerequisites

### 1. Get Business UID
```bash
# List businesses or use known business_id
GET /platform/v1/businesses
```

### 2. Get Event Instance UID
```bash
# List event instances for the business
GET /platform/v1/scheduling/events?business_id={business_id}
# Find an event with available waitlist spots
```

### 3. Get Client UID (for non-client tokens)
```bash
# List clients or create one
GET /platform/v1/clients?business_id={business_id}
```

## Test Request

### Using Client Token
```bash
curl -X POST "https://api.vcita.biz/platform/v1/scheduling/waitlist" \
  -H "Authorization: Bearer {client_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "{business_uid}",
    "event_instance_id": "{event_instance_uid}"
  }'
```

### Using Staff/App Token
```bash
curl -X POST "https://api.vcita.biz/platform/v1/scheduling/waitlist" \
  -H "Authorization: Bearer {staff_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "{business_uid}",
    "event_instance_id": "{event_instance_uid}",
    "client_id": "{client_uid}"
  }'
```

## Response Codes

| Code | Description |
|------|-------------|
| 201 | Successfully joined waitlist |
| 400 | Missing required parameter (business_id) |
| 401 | Unauthorized - invalid or expired token |
| 422 | Validation failure (invalid staff, already registered, etc.) |

## Success Response (201)
```json
{
  "data": {
    "waitlist": {
      "uid": "kqzp5epsr2wr90pn",
      "type": "waitlist",
      "status": "pending",
      "spot": 6,
      "title": "Demo class / event",
      "event_instance_uid": "49rytay9lggliv5f",
      "client_id": 7203,
      "staff_uid": "91g1yq1uzbypf5wx",
      "start_time_h": "Thu, September 16 at 2:00pm",
      "where_h": "Modiin, Israel",
      "state_summary": {
        "state": "pending",
        "state_h": "Pending"
      },
      "matter": {
        "uid": "rh3bl5x5ksjlikbh",
        "display_name": "AddedClient6"
      },
      "created_at": "2021-09-09T10:38:15.962+03:00"
    }
  },
  "status": "OK"
}
```

## Error Response (400)
```json
{
  "status": "Error",
  "error": "Mandatory parameter business_id is missing",
  "error_code": "PARAMETER_MISSING"
}
```

## Error Response (422)
```json
{
  "status": "Error",
  "error": "Invalid staff"
}
```

## Implementation Notes

1. **Validation Flow**: `business_id` is validated at controller level (returns 400). `event_instance_id` is validated deeper in `WaitlistsApi.create_event_waitlist` (returns 422).

2. **Form Data**: If the event requires custom form fields, call `GET /platform/v1/forms?business_id={business_id}&form_type=scheduling&service_uid={event_service_id}` first to get field definitions.

3. **Double Registration Prevention**: The API uses a lock mechanism to prevent the same client from joining the waitlist twice simultaneously.

## Code References
- Controller: `modules/scheduling/app/controllers/platform/v1/scheduling/waitlist_controller.rb:8`
- BookingsAPI: `modules/scheduling/app/components/bookings_api.rb:714`
- WaitlistsApi: `modules/scheduling/app/components/waitlists_api.rb:3`
