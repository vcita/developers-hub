## Resource

A schedulable resource instance (e.g., room, equipment) belonging to a resource type. Resources are used in scheduling to ensure physical resources are available when booking appointments.

## Properties

| Name | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| uid | string | No | Auto-generated UUID | The entity's unique identifier |
| created_at | string (datetime) | No | ISO 8601 format | Creation date and time |
| updated_at | string (datetime) | No | ISO 8601 format | Last update date and time |
| resource_type_uid | string | Yes | Must reference existing ResourceType | The resource type this instance belongs to |
| name | string | Yes | **maxLength: 30** | The display name of the resource |
| deleted_at | string (datetime) | No | Nullable | Soft delete timestamp. Null for active resources |

## Business Rules & Limits

1. **Maximum Resources per Type**: 10 resources per resource type
2. **Soft Delete**: Resources are soft-deleted (deleted_at timestamp is set, not physically removed)
3. **Name Length**: Maximum 30 characters
4. **Cascading**: Deleting a resource type does NOT automatically delete its resources

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

- [ResourceType](resourceType.md) - Parent category that this resource belongs to
- [AvailabilitySlot](availabilitySlot.md) - Resources appear in availability slots when available
- Service - Services can require specific resource types for booking

## Example

```json
{
  "uid": "a4ca2054-3bb0-4788-8e9e-ee2442975e22",
  "created_at": "2023-06-15T11:30:00Z",
  "updated_at": "2023-06-15T15:45:10Z",
  "resource_type_uid": "94ca2054-3bb0-4788-8e9e-ee2442975cdd",
  "name": "Treatment Room 1",
  "deleted_at": null
}
```

## API Endpoints

- [GET /v3/scheduling/resources](/reference/get-all-resources) - List all resources
- [POST /v3/scheduling/resources](/reference/create-a-resource) - Create a new resource
- [GET /v3/scheduling/resources/{uid}](/reference/retrieve-a-resource) - Get a specific resource
- [PUT /v3/scheduling/resources/{uid}](/reference/update-a-resource) - Update a resource
- [DELETE /v3/scheduling/resources/{uid}](/reference/delete-a-resource) - Soft-delete a resource

## Common Errors

| Error Code | HTTP Status | Cause | Resolution |
|------------|-------------|-------|------------|
| 403 Forbidden | 403 | Feature flags not enabled | Contact admin to enable `pkg.sch.resources` and `resources` |
| 403 Forbidden | 403 | Missing permission | Ensure token has `account.settings.manage` permission |
| 404 Not Found | 404 | Resource doesn't exist | Verify the resource UID |
| 422 Validation Error | 422 | Exceeded 10 resources per type | Delete existing resources or create a new resource type |
