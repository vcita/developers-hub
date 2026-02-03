# GET /v3/scheduling/resources/{uid}

## Endpoint Summary
Retrieve a specific resource by its UID.

## Authentication
- **Token Type:** Staff Token (Bearer)
- **Required:** Yes

## Parameters

### Path Parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `uid` | string | Yes | Unique identifier of the Resource (UUID format) |

### Query Parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `with_deleted` | boolean | No | false | Include soft-deleted resources in response |

## Prerequisites
To test this endpoint, you need:
1. A valid Staff Token for the business
2. An existing Resource UID (create one first via `POST /v3/scheduling/resources`)

### Getting a Resource UID
```bash
# First, create a resource type
curl -X POST "https://api.vcita.biz/v3/scheduling/resource_types" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Room"}'

# Note the resource_type_uid from response, then create a resource
curl -X POST "https://api.vcita.biz/v3/scheduling/resources" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Room 1", "resource_type_uid": "<resource_type_uid>"}'

# Note the resource uid from response
```

## Test Request

### Basic Request
```bash
curl -X GET "https://api.vcita.biz/v3/scheduling/resources/{uid}" \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

### With Deleted Resources
```bash
curl -X GET "https://api.vcita.biz/v3/scheduling/resources/{uid}?with_deleted=true" \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

## Expected Responses

### 200 OK - Success
```json
{
  "status": "success",
  "data": {
    "uid": "94ca2054-3bb0-4788-8e9e-ee2442975cdd",
    "name": "Room 1",
    "resource_type_uid": "abc123-def456",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "deleted_at": null
  }
}
```

### 302 - OAuth Redirect
Returned when no authentication token is provided.

### 401 - Unauthorized
```json
{
  "status": "error",
  "message": "Valid business context is required"
}
```

### 403 - Forbidden
```json
{
  "status": "error",
  "message": "Not authorized to access this resource"
}
```
Returned when the resource belongs to a different business.

### 404 - Not Found
```json
{
  "status": "error",
  "message": "Resource not found"
}
```
Returned when:
- Resource UID doesn't exist
- Resource is deleted and `with_deleted=false` (default)

### 408 - Request Timeout
Returned when request exceeds timeout limit.

## Implementation Details
- **Controller:** `src/scheduling/controllers/resource.controller.ts:163-191`
- **Method:** `findOne()`
- **Multi-tenant:** Resources are filtered by `business_uid` from auth token
- **Soft Delete:** By default, deleted resources are excluded unless `with_deleted=true`

## Validation Verified
- [x] Path parameter `uid` documented and implemented
- [x] Query parameter `with_deleted` documented and implemented
- [x] Token type (Staff Token) matches implementation
- [x] Response codes match implementation
