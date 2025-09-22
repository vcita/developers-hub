## Appointment

Represents a scheduled appointment, including timing, participants, pricing, and state.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| approval_mode | Approval mode for the appointment, if applicable | string |  |
| auto_follow_up_hours | Number of hours after which an automatic follow-up occurs | number |  |
| business_uid | Unique identifier of the business | string |  |
| category_name | Category of the appointment, if applicable | string |  |
| charge_type | Type of charge associated with the appointment | string (enum: `no_price`, `fixed_price`, `hourly_rate`, `custom`) |  |
| client_color_id | ID representing the client's color preference or tag | integer |  |
| client_first_name | First name of the client | string |  |
| client_id | Unique identifier of the client | string |  |
| client_last_name | Last name of the client | string |  |
| conversation_id | Unique identifier of the conversation related to this appointment | string |  |
| coupon | Applied coupon code, if any | string |  |
| created_at | Timestamp of when the appointment was created | string |  |
| currency | Currency used for the appointment pricing | string |  |
| duration | Duration of the appointment in minutes | integer |  |
| end_time | Timestamp indicating when the appointment ends | string |  |
| follow_up_data | Additional data for follow-ups, if any | object |  |
| follow_up_note | Notes related to follow-ups | string |  |
| follow_up_time | Timestamp for the follow-up, if applicable | string |  |
| follow_up_type | Type of follow-up (e.g., email, phone, in-person) | string |  |
| future_bookings_limit | Limit for future bookings related to this appointment | integer |  |
| uid | Unique identifier of the appointment | string |  |
| image_url | URL to an image associated with the appointment | string |  |
| initiator | Entity that initiated the appointment | string |  |
| interaction_details | Details regarding the interaction for the appointment | string |  |
| interaction_type | Type of interaction for the appointment | string (enum: `client_location`, `business_location`, `virtual`) |  |
| invoices | List of invoices associated with the appointment | array<object> |  |
| is_recurring | Indicates whether the appointment is recurring | boolean |  |
| last_action_message | Message associated with the last action taken | string |  |
| linked_booking_uid | UID of a linked booking, if applicable | string |  |
| meeting_reminder_sms_1 | Indicates whether the first SMS reminder is enabled | boolean |  |
| meeting_reminder_sms_2 | Indicates whether the second SMS reminder is enabled | boolean |  |
| min_hours_before_meeting | Minimum number of hours before the meeting can be booked | integer |  |
| no_show | Indicates whether the client did not show up | boolean |  |
| notes | Additional notes for the appointment | string |  |
| optional_times | Array of optional times available for rescheduling | array<string> |  |
| payment_uid | Identifier for the payment, if applicable | string |  |
| payment_status | Status of the payment | string |  |
| price | Price of the appointment | string |  |
| remind_before_in_hours_1 | Hours before appointment for the first reminder | number |  |
| remind_before_in_hours_2 | Hours before appointment for the second reminder | number |  |
| request_data | Additional request data, if applicable | object |  |
| series_uid | ID of the series if this appointment is part of one | string |  |
| series_instance_count | Number of instances in the appointment series | integer |  |
| service_uid | Identifier of the service associated with the appointment | string |  |
| sms_booking_confirmation | SMS confirmation details, if applicable | string |  |
| source_data | Source data indicating how the appointment was initiated | object |  |
| staff_display_name | Name of the staff member handling the appointment | string |  |
| staff_uid | Unique identifier of the staff member | string |  |
| staff_image | Image URL of the staff member | string |  |
| start_time | Timestamp of when the appointment starts | string |  |
| state | Current state of the appointment | string (enum: `scheduled`, `canceled`, `completed`, `pending`) |  |
| title | Title of the appointment | string |  |
| type | Type of entity (appointment) | string (enum: `appointment`) |  |
| updated_at | Timestamp of the last update | string |  |
| zoom_start_url | URL for the Zoom meeting, if applicable | string |  |

### Source Data Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| campaign |  | string |  |
| channel |  | string |  |
| id |  | integer |  |
| name |  | string |  |
| website_url |  | string |  |