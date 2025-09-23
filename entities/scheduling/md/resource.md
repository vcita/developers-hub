## Resource

A schedulable resource instance (e.g., room, equipment) belonging to a resource type.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The entity's unique identifier | string |  |
| created_at | Creation date and time | string |  |
| updated_at | Last update date and time | string |  |
| resource_type_uid | The resource type this instance belongs to. Links to the ResourceType entity | string | Yes |
| name | The name of the resource | string | Yes |
| deleted_at | Soft delete timestamp. Null for active resources | string |  |

## Example

JSON

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