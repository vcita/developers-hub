## ClientPaymentGateway

Client-facing payment gateway information with limited fields for security and privacy. This entity contains only the essential information needed by clients to understand available payment options.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The unique identifier (UID) of the payment gateway. | string |  |
| gateway_name | The unique name of the payment gateway initialized when the owning app was created, provided as the name parameter to the App Creation API. | string |  |
| supported_countries | A list of countries supported by the payment gateway, represented using ISO 3166-1 alpha-2 country codes. | array of strings | Yes |
| supported_currencies | A list of currencies supported by the payment gateway, represented using ISO 4217 format. | array of strings | Yes |
| status | Indicates the current status of the payment gateway: 'active' (available for use), 'disabled' (not available for use), or 'deprecated' (still available but not recommended for new integrations) | string (enum: `active`, `disabled`, `deprecated`) | Yes |
| payment_methods | The payment methods supported by the gateway. | object | Yes |
| processing_features | The features the payment gateway supports and their current state (enabled/disabled). | object | Yes |

### Payment Methods Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| credit_card | Indicates if the gateway supports credit card payments. | boolean |  |
| ach | Indicates if the gateway supports ACH payments. | boolean |  |
| ideal | Indicates if the gateway supports iDeal payments. | boolean |  |
| bancontact | Indicates if the gateway supports Bancontact payments. | boolean |  |
| twint | Indicates if the gateway supports Twint payments. | boolean |  |

### Processing Features Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| multi_currency | Indicates if the gateway supports multi-currency transactions. | boolean | Yes |
| back_office_charge | Indicates if the gateway allows the SMB to process charges directly from the back office. | boolean | Yes |
| checkout | Indicates whether the payment gateway supports a checkout option initiated from the client portal. This value must always be set to true, as client portal checkout is a core feature. | boolean | Yes |
| refund | Indicates if the gateway supports full online refunds. | boolean | Yes |
| partial_refund | Indicates if the gateway supports partial online refunds. Requires full refunds to be enabled. | boolean | Yes |
| client_save_card_on_checkout | Indicates if clients can save cards on file during a payment flow. | boolean | Yes |
| client_save_card_standalone | Indicates if clients can save cards on file through a standalone flow. | boolean | Yes |
| save_card_by_business | Indicates if the gateway supports saving cards on file from the business side. | boolean | Yes |

## Example

JSON

```json
{
  "uid": "pgw_abc123def456",
  "gateway_name": "stripe_payments_v2",
  "supported_countries": [
    "US",
    "CA",
    "GB",
    "AU",
    "DE",
    "FR",
    "ES",
    "IT"
  ],
  "supported_currencies": [
    "USD",
    "EUR",
    "GBP",
    "CAD",
    "AUD"
  ],
  "status": "active",
  "payment_methods": {
    "credit_card": true,
    "ach": true,
    "ideal": true,
    "bancontact": false,
    "twint": false
  },
  "processing_features": {
    "multi_currency": true,
    "back_office_charge": true,
    "checkout": true,
    "refund": true,
    "partial_refund": true,
    "client_save_card_on_checkout": true,
    "client_save_card_standalone": true,
    "save_card_by_business": true
  }
}
```