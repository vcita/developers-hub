## VoiceCallSetting

Defines voice call settings for a staff member/business, including forwarding, policies, and scripts.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The unique identifier of the VoiceCallSetting entity | string |  |
| staff_uid | The unique identifier of the staff receiving the forwarded call | string |  |
| forward_number | The phone number of the staff receiving the forwarded call | string |  |
| dedicated_number | The dedicated number of the business receiving calls from clients | string |  |
| forwarding_enabled | Indicates if voice call forwarding is enabled | boolean | Yes |
| call_forwarding_policy | Specifies the conditions under which calls are forwarded based on staff availability | string (enum: `ALWAYS`, `WORK_HOURS`, `NEVER`) |  |
| staff_weekly_availability_uid | The unique identifier represents the weekly working hours availability list object of staff members
This list will assist deciding if to forward the call to staff or its out of the working hours (in case forwarding policy is WORK_HOURS). | string |  |
| call_timeout_sec | Call ringing timeout in seconds | number |  |
| publish_number | Indicates if the dedicated number should be published as the business's phone number. | boolean |  |
| voice_scripts | The voice_scripts property within the voiceCallSettings entity allows for the configuration of various voice messages that are played to callers during different stages of a voice call. Each key-value pair within voice_scripts represents a specific voice message, identified by a unique name.

Structure:
key: String - The name of the voice message configuration (e.g., greeting_message, missed_call_message). This key can be any descriptive name suitable for the specific message.

value: Object - Contains the following properties:
message: String - The actual voice message that will be played to the caller.
enabled: Boolean - A flag indicating whether this specific voice message is enabled or disabled. | object |  |
| external_app_config | A configuration JSON object defining the external AI app managing the voice call.
The object defines three keys:
app_name: the name of the app used (for internal use)
full_url: the endpoint related to that app
method: the HTTP method that should be used (GET/POST) | object |  |
| created_at | The date and time when the VoiceCallSetting entity was created | string |  |
| updated_at | The date and time when the VoiceCallSetting entity was updated | string |  |
| deleted_at | The date and time when the VoiceCallSetting entity was deleted | string |  |

## Example

JSON

```json
{
  "uid": "56ah3478b56c",
  "staff_uid": "5ya4gbwm2c3qic8",
  "forward_number": "180348567634",
  "dedicated_number": "12845783457",
  "forwarding_enabled": true,
  "call_forwarding_policy": "WORK_HOURS",
  "staff_weekly_availability_uid": "0c4ac9717ab26f56",
  "call_timeout_sec": 20,
  "publish_number": true,
  "voice_scripts": {
    "greeting_message": {
      "message": "Hi, The call will be forwarded soon, please wait.",
      "enabled": true
    },
    "missed_call_message": {
      "message": "Sorry, please try again later.",
      "enabled": false
    }
  },
  "external_app_config": {
    "app_name": "my.pa",
    "full_url": "https://ww.example.com/my/pa/ncco",
    "method": "GET"
  },
  "created_at": "2024-01-01T09:00:00Z",
  "updated_at": "2024-03-20T12:34:56Z",
  "deleted_at": null
}
```