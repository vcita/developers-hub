## BusinessAppInstall

Represents an installed app for a business.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier for the business app install record. | string |  |
| business_uid | Unique identifier of the business that has the app installed. | string | Yes |
| app_code_name | The unique code name of the installed app (e.g., "calendar_sync"). | string | Yes |
| created_at | The date and time when the install record was created, in ISO 8601 format. | string |  |
| updated_at | The date and time when the install record was last updated, in ISO 8601 format. | string |  |

## Example

JSON

```json
{
  "uid": "a1b2c3d4e5f6a1b2",
  "business_uid": "d290f1ee6c544b01",
  "app_code_name": "calendar_sync",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```
