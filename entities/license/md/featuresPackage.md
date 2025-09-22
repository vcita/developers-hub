## FeaturesPackage

Defines a plan package's quotas, settings, and included features.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier for the plan package. | integer |  |
| name | Internal name of the plan package. | string | Yes |
| display_name | Display name of the plan package shown to users. | string | Yes |
| quotas | Quotas and limits for the plan package. | object |  |
| settings | Settings and configurations for the plan package. | object |  |
| free | Indicates if this is a free plan package. | boolean | Yes |
| created_at | Timestamp when the plan package was created. | string | Yes |
| updated_at | Timestamp when the plan package was last updated. | string | Yes |
| features | List of features included in the plan package. | array<object> | Yes |

**Required fields**: `id`, `name`, `display_name`, `staff_slots`, `free`, `created_at`, `updated_at`, `features`

### Quotas Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| campaign_recipients_monthly_quota | Monthly quota for campaign recipients. | integer |  |
| invoice_monthly_quota | Monthly quota for the number of invoices that can be created in the account. If omitted, the plan package has no limit on the number of invoices. | integer |  |
| estimate_monthly_quota | Monthly quota for the number of estimates that can be created in the account. If omitted, the plan package has no limit on the number of estimates. | integer |  |
| sms_monthly_quota | Monthly quota for SMS messages. This is an array of objects, each containing a `country_code` and `quota`. | object |  |
| storage_quota | Storage quota in megabytes (MB) for the plan package. | integer |  |
| clients_credit | Monthly quota for the number of clients that can be added to the account. If ommited, the plan package has no limit on the number of clients. | integer |  |
| campaigns_credit | Monthly quota for the number of campaigns that can be created in the account. If omitted, the plan package has no limit on the number of campaigns. | integer |  |
| booking_credit | Monthly quota for the number of appointment bookings that can be made in the account. If omitted, the plan package has no limit on the number of bookings. | integer |  |

### Settings Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| disable_add_staff_button | Whether the add staff button is disabled. | boolean |  |
| disable_staff_slots | Whether staff slots are disabled. | boolean |  |
| disable_sms_purchase_button | Whether the SMS purchase button is disabled. | boolean |  |

### Example

JSON

```json
{
  "id": 1,
  "name": "scheduling",
  "display_name": "Online Scheduling",
  "quotas": {
    "campaign_recipients_monthly_quota": 300,
    "invoice_monthly_quota": 100,
    "estimate_monthly_quota": 50,
    "sms_monthly_quota": {
      "us_canada": 1000,
      "other": 500
    },
    "storage_quota": 5000,
    "clients_credit": 1000,
    "campaigns_credit": 10,
    "booking_credit": 500
  },
  "settings": {
    "disable_add_staff_button": true,
    "disable_staff_slots": true,
    "disable_sms_purchase_button": true
  },
  "free": true,
  "created_at": "Wed, May 29, 2013 at 12:21pm",
  "updated_at": "Tue, June 10 at 11:12am",
  "features": [
    {
      "id": 1,
      "name": "basic_business_features",
      "description": "Privilege to turn on reminder in cliche, email signature in vCita, Allow business to mark message as read/unread"
    },
    {
      "id": 2,
      "name": "scheduling_features",
      "description": "SMS booking confirmation, scheduling notice, auto follow up hours, meeting auto response, charge type, reminders, client card fields no multiline. if this feature is not on there is only in test quota for online scheduling"
    },
    {
      "id": 3,
      "name": "invoicing_features",
      "description": "Allow invoicing for an account (payments module sub feature)"
    }
  ]
}
```