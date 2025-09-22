## ResourceType

Defines a type/category of resource required by services (e.g., room type).

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The entity's unique identifier | string |  |
| created_at | Creation date and time | string |  |
| updated_at | Last update date and time | string |  |
| name | The name of the resource type | string | Yes |
| services | Array of service UIDs that require this resource type | array<string> |  |

**Required fields**: `name`

### Example

JSON

```json
{
  "uid": "94ca2054-3bb0-4788-8e9e-ee2442975cdd",
  "created_at": "2023-06-15T10:30:00Z",
  "updated_at": "2023-06-15T14:45:10Z",
  "name": "Treatment Room",
  "services": [
    "service_uid_1",
    "service_uid_2"
  ]
}
```