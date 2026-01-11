## ResourceType

Defines a type/category of resource required by services (e.g., "Treatment Room", "Massage Table"). Resource types group similar resources together and can be associated with services that require them.

## Properties

| Name | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| uid | string | No | Auto-generated UUID | The entity's unique identifier |
| created_at | string (datetime) | No | ISO 8601 format | Creation date and time |
| updated_at | string (datetime) | No | ISO 8601 format | Last update date and time |
| name | string | Yes | **maxLength: 20** | The display name of the resource type |
| services | array of strings | No | Valid service UIDs | Array of service UIDs that require this resource type |
| deleted_at | string (datetime) | No | Nullable | Soft delete timestamp. Null for active resource types |

## Business Rules & Limits

1. **Maximum Resource Types per Business**: 5 resource types per business
2. **Soft Delete**: Resource types are soft-deleted (deleted_at timestamp is set)
3. **Name Length**: Maximum 20 characters
4. **No Cascade Delete**: Deleting a resource type does NOT automatically delete its resources
5. **Initial Resources**: When creating a resource type, you can optionally specify `initial_resource_count` (1-10) to auto-create resources

## Access Requirements

### Feature Flags
Both of the following feature flags must be enabled:
- `pkg.sch.resources`
- `resources`

If either flag is disabled, create/update/delete operations will return **403 Forbidden**.

### Permissions
- **Read**: Any authenticated staff token
- **Create/Update/Delete**: Requires `account.settings.manage` permission

### Token Types
- ✅ Staff Tokens
- ❌ Directory Tokens
- ❌ Client Tokens

## Related Entities

- [Resource](resource.md) - Individual resource instances belonging to this type
- [AvailabilitySlot](availabilitySlot.md) - Resource types can be used to filter availability
- Service - Services can be associated with resource types they require

## Example

```json
{
  "uid": "94ca2054-3bb0-4788-8e9e-ee2442975cdd",
  "created_at": "2023-06-15T10:30:00Z",
  "updated_at": "2023-06-15T14:45:10Z",
  "name": "Treatment Room",
  "services": [
    "service_uid_1",
    "service_uid_2"
  ],
  "deleted_at": null
}
```

## API Endpoints

- [GET /v3/scheduling/resource_types](/reference/get-all-resourcetypes) - List all resource types
- [POST /v3/scheduling/resource_types](/reference/create-a-resourcetype) - Create a new resource type
- [GET /v3/scheduling/resource_types/{uid}](/reference/retrieve-a-resourcetype) - Get a specific resource type
- [PUT /v3/scheduling/resource_types/{uid}](/reference/update-a-resourcetype) - Update a resource type
- [DELETE /v3/scheduling/resource_types/{uid}](/reference/delete-a-resourcetype) - Soft-delete a resource type

## Common Errors

| Error Code | HTTP Status | Cause | Resolution |
|------------|-------------|-------|------------|
| 403 Forbidden | 403 | Feature flags not enabled | Contact admin to enable `pkg.sch.resources` and `resources` |
| 403 Forbidden | 403 | Missing permission | Ensure token has `account.settings.manage` permission |
| 404 Not Found | 404 | Resource type doesn't exist | Verify the resource type UID |
| 422 Validation Error | 422 | Exceeded 5 resource types per business | Delete existing resource types first |

## Usage Example

### Creating a Resource Type with Initial Resources

```javascript
// Create a resource type with 3 initial resources
const response = await api.post('/v3/scheduling/resource_types', {
  name: 'Treatment Room',
  services: ['service_uid_1'],
  initial_resource_count: 3
});

// This creates:
// - 1 resource type named "Treatment Room"
// - 3 resources named "Treatment Room 1", "Treatment Room 2", "Treatment Room 3"
```
