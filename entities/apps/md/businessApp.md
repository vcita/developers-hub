## BusinessApp

Represents an app installed for a business, including installation state.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | A unique identifier for the record | string |  |
| created_at | The creation date and time of the entity | string |  |
| updated_at | The last updated date and time of the entity | string |  |
| business_uid | The unique identifier of the business | string | Yes |
| app_id | The unique identifier of the app. | number | Yes |
| installed | Indicates whether or not the app is installed for the business. | boolean | Yes |

**Required fields**: `business_uid`, `app_id`, `installed`

### Example

JSON

```json
{
  "id": 52332,
  "updated_at": "2024-03-20T12:34:56Z",
  "created_at": "2024-01-01T09:00:00Z",
  "business_uid": "asdqwe234gbaqghg23",
  "app_id": 654,
  "installed": true
}
```