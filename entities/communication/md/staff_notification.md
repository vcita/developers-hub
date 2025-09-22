## Staff Notification

An instance of a notification sent to a staff member, including delivery content and statuses.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The unique identifier of the staff notification. | string | Yes |
| staff_uid | The unique identifier of the staff member associated with this notification. | string | Yes |
| notification_template_code_name | The code name identifying the notification template to be used. | string | Yes |
| locale | The language locale for the notification content. | string (enum: `en`, `fr`, `de`, `it`, `pl`, `pt`, `es`, `nl`, `he`, `sl`, `en_gb`) | Yes |
| params | Additional parameters for populating notification templates. | array<object> |  |
| staff_portal_content | Settings for pane notifications | object |  |
| email_content | Settings for email notifications | object |  |
| push_status | The current delivery status of the push notification. | string (enum: `sent`, `failed`) |  |
| pane_status | The current delivery status of the pane notification. | string (enum: `sent`, `read`, `failed`) |  |
| email_status | History of delivery statuses for the email notification. Each entry represents a status the notification has passed through, in chronological order. | array<string> |  |
| created_at | The date and time when the staff notification was created, in ISO 8601 format. | string | Yes |
| updated_at | The date and time when the staff notification was last updated, in ISO 8601 format. | string | Yes |

**Required fields**: `uid`, `staff_uid`, `notification_template_code_name`, `locale`, `created_at`, `updated_at`

### Staff Portal Content Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| title | Title for the notification. | string | Yes |
| message_body | Message body for the notification. | string | Yes |
| deep_link | Optional deep link URL for notification action. | string |  |

### Email Content Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| subject | Email subject line. | string | Yes |
| top_image | Image at the top of the email. | object |  |
| main_title | Header or introduction text for the email. | string | Yes |
| main_text | Main content of the email. | string | Yes |
| middle_image | Image in the middle of the email. | object |  |
| middle_text | Middle content of the email. | string |  |
| footer_text | Footer or closing text for the email. | string |  |
| primary_cta_button | Call-to-action button details. | object |  |
| secondary_cta_button | Secondary call-to-action button details. | object |  |

### Example

JSON

```json
{
  "uid": "staff-notification-12345",
  "staff_uid": "staff-67890",
  "notification_template_code_name": "new_appointment_created",
  "locale": "en",
  "params": [
    {
      "key": "client_name",
      "value": "John Doe"
    },
    {
      "key": "appointment_time",
      "value": "2023-05-15T14:30:00Z"
    }
  ],
  "staff_portal_content": {
    "title": "New appointment",
    "message_body": "You have a new appointment",
    "deep_link": "/appointments/12345"
  },
  "email_content": {
    "subject": "Appointment Confirmation",
    "main_title": "Your appointment is confirmed!",
    "main_text": "Thank you for booking with us. Your appointment is scheduled.",
    "footer_text": "If you have questions, contact us anytime."
  },
  "push_status": "sent",
  "pane_status": "read",
  "email_status": [
    "delivered",
    "open"
  ],
  "created_at": "2023-05-10T09:00:00Z",
  "updated_at": "2023-05-10T09:05:00Z"
}
```