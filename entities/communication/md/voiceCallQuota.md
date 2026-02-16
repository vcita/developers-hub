## VoiceCallQuota

Tracks remaining voice call minutes for a business.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier of the quota object. | string |  |
| business_uid | Unique identifier of the business that the quota relates to. | string |  |
| remaining_minutes | The remaining minutes for calls. | integer |  |
| created_at | The time the quota was created. | string |  |
| updated_at | The time the quota was last updated. | string |  |

## Example

JSON

```json
{
  "uid": "d290f1ee6c544b01",
  "business_uid": "d290f1e6c544b0190e6",
  "remaining_minutes": 100,
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z"
}
```