## ClientSettings

Client-level settings such as communication preferences and opt-outs.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| client_uid | The unique identifier (UID) of the client | string | Yes |
| opt_out_transactional_sms | The opt out status of the client for transactional SMS messages | boolean | No (default: false) |
| created_at | Timestamp when the settings were created | string (date-time) | Yes |
| updated_at | Timestamp when the settings were last updated | string (date-time) | Yes |

## Business Rules

### SMS Opt-Out Behavior

When `opt_out_transactional_sms` is set to `true`, the client will **not** receive:
- Appointment reminders
- Booking confirmations
- Rescheduling notifications
- Cancellation notifications
- Other transactional SMS messages

**Note:** Marketing/promotional SMS is managed separately and is not affected by this setting.

### Default Settings

New clients are created with `opt_out_transactional_sms` set to `false` by default, meaning they will receive transactional SMS messages.

## Related Endpoints

- `GET /v3/clients/settings/{client_uid}` - Get client settings
- `PUT /v3/clients/settings/{client_uid}` - Update client settings

## Example

```json
{
  "client_uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "opt_out_transactional_sms": true,
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z"
}
```