## ClientSettings

Client-level settings such as communication preferences and opt-outs.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| client_uid | The unique identifier (UID) of the chat | string | Yes |
| opt_out_transactional_sms | The opt out status of the client for transactional SMS messages | boolean |  |

## Example

JSON

```json
{
  "client_uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "opt_out_transactional_sms": true,
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z"
}
```