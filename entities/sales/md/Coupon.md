## Coupon

Represents a discount coupon with validity window, scope, and redemption limits.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid |  | string | Yes |
| business_uid | The business the coupon belongs to | string |  |
| coupon_name | A human-readable name for the coupon | string | Yes |
| discount_type | Type of discount offered, fixed: for fixed amount, percent: for percentage disscount | string (enum: `fixed`, `percent`) | Yes |
| discount_value | The discount amount (decimal) given by applying the coupon. If the coupon type is "fixed" then the amount is the discount given, keeping the same currency as the item ($5.5). If the type is "percent" then the amount is the discount percent from the original price (5.3%) | number | Yes |
| coupon_code | A unique identifier or code for the coupon | string | Yes |
| status | The status of the coupon | string (enum: `active`, `scheduled`, `expired`) |  |
| valid_for_services | A list of services (UIDs) where the coupon can be applied | array<string> |  |
| valid_for_staff | A list of staff (UIDs) where the coupon can be applied | array<string> |  |
| start_date | The start date when the coupon becomes active, in ISO 8601 format | string | Yes |
| expiration_date | The expiry date when the coupon is no longer valid, in ISO 8601 format | string | Yes |
| max_redemptions | The maximum number of times the coupon can be used | number |  |
| max_redemptions_per_client | The maximum number of times an individual client can use the coupon | number |  |
| total_redemptions | The total number of times the coupon has been redeemed | number |  |
| created_at | The creation date and time of the coupon, in ISO 8601 format | string |  |
| updated_at | Updated date and time of the coupon, in ISO 8601 format | string |  |

**Required fields**: `uid`, `coupon_name`, `discount_type`, `discount_value`, `coupon_code`, `start_date`, `expiration_date`

### Example

JSON

```json
{
  "uid": "56a78b56c",
  "business_uid": "hfjds47r534",
  "coupon_name": "Summer 2024",
  "discount_type": "fixed",
  "discount_value": "20",
  "coupon_code": "SAVE20",
  "status": "active",
  "valid_for_services": [
    "5ya4gbwm2c3qoic8"
  ],
  "valid_for_staff": [
    "0c4ac9717ab26f56"
  ],
  "start_date": "2024-03-20T12:34:56Z",
  "expiration_date": "2024-01-01T09:00:00Z",
  "max_redemptions": 100,
  "max_redemptions_per_client": 1,
  "total_redemptions": 23,
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z"
}
```