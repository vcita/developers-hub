## Subscription

Represents an active or historical subscription purchased by a business for an offering/SKU.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The entity unique identifier | string | Yes |
| created_at | The creation date and time of the object | string | Yes |
| updated_at | The last updated date and time of the object | string | Yes |
| display_name | The subscription display name | string | Yes |
| is_active | Calculated active subscription is when the subscription is not canceled and not expired | boolean |  |
| offering_uid | The underlying directory offering uid | string | Yes |
| offering_type | Category of the offering. Possible values include: **plan**: For the main business subscription; **app**: for marketplace app subscriptions; **SMS**: For text message offerings; **staff_seat**: For additional business seats. | string (enum: `package`, `app`, `sms`, `staff_slot`) |  |
| purchase_state | The current subscription state. **pending**: The subscription is pending a payment approval; **purchased**: The subscription is paid for and active; **canceled**: The subscription was canceled and will expire on expiration_date; **expired**: The subscription was expired. | string (enum: `pending`, `purchased`, `cenceled`, `expired`) |  |
| cancellation_date | The date when subscription was canceled | string |  |
| expiration_date | The date when subscription will expire (or expired) | string |  |
| buyer_uid | The actor of the action. typically, the staff uid | string | Yes |
| business_uid | The business that the subscription relates to | string | Yes |
| purchase_price | The purchase price at the moment of the subscription was created | number | Yes |
| purchase_currency | The purchase currency at the moment of the subscription was created. Currently supported currencies: USD; EUR; GPB. | string (enum: `USD`, `EUR`, `GBP`) | Yes |
| payment_type | The payment type field defines the payment options available for an offering, **free**: No payment is required; **one_time**: A single, one-time payment is required to obtain the offering; **monthly**: A recurring payment made on a monthly basis; **annual**: A recurring payment made on a yearly basis; **bundle**: A subscription bundled with another subscription | string (enum: `monthly`, `annual`, `free`, `single_charge`, `bundle`, `external`) | Yes |
| bundled_from_subscription_uid | The subscription uid that this subscription is bundled from | string |  |
| charged_by | Who charges for this subscription. **partner**: Transaction managed by partner; **platform**: Transaction managed within the platform's integral billing system | string (enum: `partner`, `platform`) | Yes |
| trial_type | Not supported | string (enum: `no_trial`, `automatic_charge`, `expire`) |  |
| next_charge_date | The start date of the next billing cycle. This property is `null` if the subscription is set to expire. | string |  |
| quantity |  The number of units (e.g., staff seats, SMS messages, AI tokens) allocated under this offering, defining the quantity available for use during the subscription period. | number |  |
| can_purchase_additional_seats | Indicates if a business can purchase additional seats beyond the bundled subscription (default: True); if False, only the bundled seats are available. | boolean |  |
| sku | The SKU (app/packageaddon unique code name) related to this subscription | string | Yes |

**Required fields**: `uid`, `created_at`, `updated_at`, `display_name`, `offering_uid`, `buyer_uid`, `business_uid`, `purchase_price`, `purchase_currency`, `payment_type`, `charged_by`, `sku`

### Example

JSON

```json
{
  "uid": "c33f32c-95ae-4e8f-9f65-18bba589cb43",
  "created_at": "2024-01-01T09:00:00Z",
  "updated_at": "2024-03-20T12:34:56Z",
  "display_name": "Premium 10",
  "sku": "premium_10",
  "is_active": true,
  "offering_uid": "bc33f12d-98ee-428f-9f65-18bba589cb95",
  "offering_type": "package",
  "purchase_state": "purchased",
  "cancellation_date": "",
  "expiration_date": "",
  "buyer_uid": "user_12345",
  "business_uid": "biz_67890",
  "purchase_price": 99.99,
  "purchase_currency": "USD",
  "payment_type": "monthly",
  "bundled_from_subscription_uid": "",
  "charged_by": "platform",
  "trial_type": "no_trial",
  "next_charge_date": "2025-03-20T12:34:56Z",
  "quantity": 1,
  "can_purchase_additional_seats": true
}
```