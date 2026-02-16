## StaffWidgetsBoardsTemplate

Defines the default widget board template for all members within a directory

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier of the entity | string |  |
| owner_type | The type of template owner, e.g directory, business, etc. | string (enum: `directory`, `business`) |  |
| owner_uid | The unique identifier of the template's owner | string |  |
| staff_uid | The unique identifier of the staff member whose template is being cloned | string |  |
| created_at | The timestamp indicating when the template was created, in ISO 8601 format | string |  |
| updated_at | The timestamp indicating the last time the template was updated, in ISO 8601 format | string |  |

## Example

JSON

```json
{
  "uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "owner_type": "directory",
  "owner_uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "staff_uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z"
}
```