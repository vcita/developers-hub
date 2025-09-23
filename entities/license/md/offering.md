## Offering

An Offering represents a commercial agreement in the inTandem platform, describing the various attributes of the commercial terms, including pricing, type, and additional metadata.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The entity unique identifier | string |  |
| created_at | Timestamp indicating when the entity was created | string |  |
| updated_at | Timestamp of the entity's most recent update | string |  |
| type | Type of the offering. Possible values include: **package** for the main business subscription; **app** for marketplace app subscriptions and **addon** for other SKUs like SMS and staff_seats. A user can have one subscription with package, one subscription per SKU of type apps and any number of subscriptions for any SKU | string (enum: `package`, `app`, `addon`) | Yes |
| SKU | The unique code of the single SKU this offering represents. Offerings support exactly one SKU; to combine multiple SKUs, use a bundledOffering or similar higher-level abstraction. | string | Yes |
| display_name | The SKU's display name | string | Yes |
| quantity | The number of items included in the offering | number | Yes |
| payment_type | The payment type field defines the payment options available for an offering,**external**: Payment is not done by the platform (typically an API call from the partner), **free**: No payment is required; **single_charge**: A single, one-time payment is required to obtain the offering; **monthly**: A recurring payment made on a monthly basis; **annual**: A recurring payment made on a yearly basis; **bundle**: A subscription bundled with another subscription | string (enum: `monthly`, `annualy`, `free`, `single_charge`, `external`, `bundle`) | Yes |
| is_active | Current status of the directory offering | boolean |  |
| vendor | The business entity or vendor that offers this SKU. | string (enum: `partner`, `inTandem`) |  |
| prices |  | array of objects | Yes |
| enable_trial | Whether or not this offering supports trial period | boolean |  |
| trial_type | Specifies how the trial option is managed. Currently, only expired is supported. Future values are - Automatic charge - when the trial period ends, automatically start charging as set in the pricing; Manually charge - when the trial ends, the subscription stays active without charging; Expire - when the trial ends, expire the subscription. | string (enum: `expire`) |  |
| trial_period | Number of days for the trial period. If not specified or set to 0, it indicates no trial period is offered. | number |  |
| reporting_tags | A list of tags to be used for reporting purposes | array of strings |  |

## Example

JSON

```json
{
  "uid": "bc33f12d-98ee-428f-9f65-18bba589cb95",
  "created_at": "2024-01-01T09:00:00Z",
  "updated_at": "2024-03-20T12:34:56Z",
  "type": "package",
  "SKU": "premium_10",
  "display_name": "Premium 10",
  "quantity": 1,
  "payment_type": "monthly",
  "is_active": true,
  "vendor": "inTandem",
  "prices": [
    {
      "price": 5,
      "currency": "USD"
    },
    {
      "price": 5,
      "currency": "EUR"
    }
  ],
  "enable_trial": false,
  "trial_type": "expire",
  "trial_period": 14,
  "reporting_tags": [
    "business-management",
    "no-payments"
  ]
}
```