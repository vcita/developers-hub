## ActivityMessage

Represents a business-initiated activity message sent to a client over email/SMS.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| business_uid | The business that is sending the message. | string |  |
| staff_uid | The staff that is sending the message. | string |  |
| client_uid | Client to send the message to. | string | Yes |
| uid | The entity's unique identifier. | string |  |
| activity_type | Activity category type from a closed list. | string (enum: `invite`) | Yes |
| activity_action | Action related to the activity type property. | string (enum: `schedule`) | Yes |
| channels | Determines if the message should be sent via email or/and SMS. | array<string> | Yes |
| message_text |  | object |  |
| cta_button_text | The text for the Email action button | string |  |
| link_url_params |  | object |  |
| created_at | The creation date and time of the message. | string |  |
| updated_at | Updated date and time of the message. | string |  |

**Required fields**: `client_uid`, `activity_type`, `activity_action`, `channels`

### Message Text Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| body | The main content of the message. | string |  |
| subject | A concise summary of the message content. | string |  |

### Link Url Params Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| utm_source | Identifies the source of traffic (e.g., website, search_engine, social_media) | string |  |
| utm_campaign | Identifies the specific marketing campaign (e.g., spring_sale, product_launch) | string |  |

### Example

JSON

```json
{
  "business_uid": "56a78b56c",
  "staff_uid": "5ya4gbwm2c3qoic8",
  "client_uid": "0c4ac9717ab26f56",
  "uid": "12a34b56c789",
  "activity_type": "invite",
  "activity_action": "schedule",
  "message_text": {
    "body": "You are invited to schedule with us online.",
    "subject": "You can now schedule with us online!"
  },
  "cta_button_text": "Schedule now",
  "link_url_params": {
    "utm_source": "newsletter",
    "utm_campaign": "summer_sale"
  },
  "channels": [
    "email",
    "sms"
  ],
  "updated_at": "2024-03-20T12:34:56Z",
  "created_at": "2024-01-01T09:00:00Z"
}
```