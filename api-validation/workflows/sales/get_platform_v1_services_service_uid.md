# GET /platform/v1/services/{service_uid}

## Overview
Retrieves details for a specific service.

## Authentication
**Token Type:** Client JWT Token

The endpoint requires a valid Client JWT token passed in the Authorization header:
```
Authorization: Bearer <client_jwt_token>
```

## Parameters

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `service_uid` | string | Yes | The unique identifier of the service |

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `extra_decorator_fields` | boolean | No | When true, includes additional fields like booking_restriction details |

## Prerequisites

To call this endpoint, you need:
1. A valid Client JWT token (obtained via client authentication)
2. A valid `service_uid` (can be obtained from `GET /platform/v1/services` list endpoint)

## Implementation Details

**Controller:** `Platform::V1::ServicesController#show`
**Location:** `/modules/scheduling/app/controllers/platform/v1/services_controller.rb:19-32`

**Route:** `/modules/scheduling/app/config/routes/scheduling_routes.rb:53-56`

**Authentication:** Uses `Api::ClientAuthentication` module which:
- Validates Bearer token from Authorization header (or `token` query param as fallback)
- Extracts client_uid from JWT claims
- May return `X-REFRESH-TOKEN` header if token is near expiry

## Response Codes

| Code | Description |
|------|-------------|
| 200 | Success - Service details returned |
| 401 | Unauthorized - Invalid or missing token |
| 404 | Not Found - Service does not exist |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error |

## Test Request Example

```bash
# Get service details
curl -X GET "https://api.example.com/platform/v1/services/{service_uid}" \
  -H "Authorization: Bearer <client_jwt_token>" \
  -H "Content-Type: application/json"

# With extra decorator fields
curl -X GET "https://api.example.com/platform/v1/services/{service_uid}?extra_decorator_fields=true" \
  -H "Authorization: Bearer <client_jwt_token>" \
  -H "Content-Type: application/json"
```

## Success Response Example

```json
{
  "status": "OK",
  "data": {
    "service": {
      "id": "j9c1xh0vzvkr2g0g",
      "type": "EventService",
      "name": "2 hours class",
      "charge_type": "free",
      "price": 120.0,
      "currency": "ILS",
      "duration": 120,
      "interaction_type": "business_location",
      "image_path": "/path/to/image",
      "description": "Service description"
    }
  }
}
```

## With extra_decorator_fields=true

Additional fields included:
```json
{
  "status": "OK",
  "data": {
    "service": {
      "id": "j9c1xh0vzvkr2g0g",
      "type": "EventService",
      "name": "2 hours class",
      "booking_restriction": {
        "is_client_restricted": true,
        "restricted_client_statuses": ["lead"],
        "restriction_rule_text": "Existing clients only",
        "uid": "some_uid"
      }
    }
  }
}
```

## Documentation Updates Made

1. Added `extra_decorator_fields` query parameter (was missing)
2. Updated token type from "Application & Application User" to "Client JWT Token"
3. Added error response codes (401, 404, 422, 500)
4. Added response example with actual fields from implementation

## Source Files

- **Swagger Source:** `/swagger/sales/legacy/legacy_v1_sales.json`
- **Controller:** `/modules/scheduling/app/controllers/platform/v1/services_controller.rb`
- **Routes:** `/modules/scheduling/app/config/routes/scheduling_routes.rb`
- **Auth Module:** `/lib/api/client_authentication.rb`
