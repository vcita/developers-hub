## VoiceCall

Represents a phone call record, including participants, status, recording and audit timestamps.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier of the VoiceCall object | string |  |
| duration | Duration of the call in seconds | integer |  |
| created_at | The time the call was created | string |  |
| updated_at | The time the call was last updated | string |  |
| status | The status of the call | string (enum: `incoming call`, `answered by staff`, `missed`, `answered by vonage`) |  |
| direction | Whether the call is inbound or outbound | string (enum: `inbound/outbound`) |  |
| staff_uid | Unique identifier of the staff member who answered the call | string |  |
| client_uid | Unique identifier of the client who made the call | string |  |
| from_number | The phone number the call was made from | string |  |
| to_number | The phone number the call was made to | string |  |
| recording_url | Link to the call recording | string |  |
| call_summary | Text summary of the call | string |  |
| external_app_url | Link to an application page with additional details about the call.

 | string |  |
| handled_by_staff_uid | The unique identifier of the staff who handled the call | string |  |
| handled_at | The date and time when the call was handled | string |  |
| deleted_at | Time the call was deleted - is null if the call is not deleted | string |  |

### Example

JSON

```json
{
  "uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z",
  "duration": 120,
  "status": "answered by staff",
  "direction": "inbound",
  "staff_uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "client_uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "from_number": "183466347342",
  "to_number": "183466347342",
  "recording_url": "https://example.com/recording.mp3",
  "call_summary": "Client called to ask about their account balance",
  "external_app_url": "https://example.com/call-details",
  "handled_by_staff_uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "handled_at": "2021-07-20T14:00:00.000Z",
  "deleted_at": null
}
```