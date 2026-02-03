# POST /v3/scheduling/resources

## Overview
Create a new resource instance belonging to a resource type.

## Authentication
- **Token Type**: Staff Token
- **Required Permission**: `account.settings.manage`

## Feature Flags
The following feature flags must be enabled:
- `pkg.sch.resources`
- `resources`

## Request

### Headers
```
Authorization: Bearer <staff_token>
Content-Type: application/json
```

### Body Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | The name of the resource (max 30 characters) |
| `resource_type_uid` | string | Yes | The UID of the resource type this instance belongs to |

### Example Request
```bash
curl -X POST "https://api.vcita.biz/v3/scheduling/resources" \
  -H "Authorization: Bearer <staff_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Treatment Room 1",
    "resource_type_uid": "94ca2054-3bb0-4788-8e9e-ee2442975cdd"
  }'
```

## Prerequisites

Before creating a resource, you need:
1. A valid **Staff Token** with `account.settings.manage` permission
2. An existing **Resource Type** - obtain `resource_type_uid` from:
   - `GET /v3/scheduling/resource-types` to list existing types
   - `POST /v3/scheduling/resource-types` to create a new type

## Response Codes

| Code | Description |
|------|-------------|
| 201 | Resource created successfully |
| 302 | OAuth redirect when no authentication token provided |
| 400 | Invalid input data |
| 401 | Valid business context is required |
| 403 | Resources feature not enabled OR missing `account.settings.manage` permission |
| 408 | Request exceeded timeout limit (500ms) |
| 422 | Request data failed validation (e.g., name exceeds 30 characters) |

## Validation Rules

1. **name**: Required, non-empty string, maximum 30 characters
2. **resource_type_uid**: Required, must be a valid existing resource type UID

## Example Response (201)
```json
{
  "success": true,
  "data": {
    "uid": "abc123-def456-ghi789",
    "name": "Treatment Room 1",
    "resource_type_uid": "94ca2054-3bb0-4788-8e9e-ee2442975cdd",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

## Notes
- The endpoint has a 500ms timeout configured
- Resources feature must be enabled for the business via feature flags
